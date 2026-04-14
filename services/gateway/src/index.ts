import { RELAY_SCHEMA_SQL, type GatewayClientEvent, type MessageCreatedEvent } from "@relay/config";
import { createServer } from "node:http";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import { WebSocket, WebSocketServer, type RawData } from "ws";

interface GatewayTokenPayload {
  sub: string;
  email: string;
  username: string;
}

interface ClientContext {
  socket: WebSocket;
  userId: string;
  username: string;
}

const port = Number(process.env.GATEWAY_PORT ?? 4001);
const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/relay";
const useSsl =
  process.env.DATABASE_SSL === "true" ||
  (!connectionString.includes("localhost") && !connectionString.includes("127.0.0.1"));

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined
});

const jwtSecret = process.env.JWT_SECRET ?? "relay-dev-secret";
const clients = new Set<ClientContext>();

const respond = (socket: WebSocket, payload: object) => {
  socket.send(JSON.stringify(payload));
};

const sendError = (socket: WebSocket, message: string) => {
  respond(socket, {
    type: "gateway.error",
    payload: {
      message
    }
  });
};

const broadcast = (event: MessageCreatedEvent) => {
  const serialized = JSON.stringify(event);
  clients.forEach((client) => {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(serialized);
    }
  });
};

const validateAccessToChannel = async (userId: string, channelId: string) => {
  const result = await pool.query<{ id: string }>(
    `
      select ch.id
      from channels ch
      inner join members mem on mem.server_id = ch.server_id
      where ch.id = $1 and mem.user_id = $2
      limit 1
    `,
    [channelId, userId]
  );

  return Boolean(result.rows[0]);
};

const persistMessage = async (client: ClientContext, channelId: string, content: string) => {
  const result = await pool.query<{
    id: string;
    content: string;
    user_id: string;
    channel_id: string;
    created_at: Date | string;
  }>(
    `
      insert into messages (content, user_id, channel_id)
      values ($1, $2, $3)
      returning id, content, user_id, channel_id, created_at
    `,
    [content, client.userId, channelId]
  );

  return {
    id: result.rows[0].id,
    content: result.rows[0].content,
    userId: result.rows[0].user_id,
    channelId: result.rows[0].channel_id,
    createdAt: new Date(result.rows[0].created_at).toISOString(),
    author: {
      id: client.userId,
      username: client.username
    }
  };
};

const decodeRawData = (rawMessage: RawData) => {
  if (typeof rawMessage === "string") {
    return rawMessage;
  }

  if (Buffer.isBuffer(rawMessage)) {
    return rawMessage.toString();
  }

  if (Array.isArray(rawMessage)) {
    return Buffer.concat(rawMessage).toString();
  }

  return Buffer.from(rawMessage).toString();
};

const handleMessage = async (client: ClientContext, rawMessage: RawData) => {
  let parsed: GatewayClientEvent;

  try {
    parsed = JSON.parse(decodeRawData(rawMessage)) as GatewayClientEvent;
  } catch {
    sendError(client.socket, "Relay could not parse that gateway event.");
    return;
  }

  if (parsed.type !== "message.send") {
    sendError(client.socket, "Unsupported Relay gateway event.");
    return;
  }

  const content = parsed.payload.content.trim();
  if (!content) {
    sendError(client.socket, "Message content is required.");
    return;
  }

  const allowed = await validateAccessToChannel(client.userId, parsed.payload.channelId);
  if (!allowed) {
    sendError(client.socket, "You do not have access to that channel.");
    return;
  }

  const message = await persistMessage(client, parsed.payload.channelId, content);
  broadcast({
    type: "message.created",
    payload: message
  });
};

const server = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, service: "gateway" }));
    return;
  }

  response.writeHead(404);
  response.end();
});

const wss = new WebSocketServer({ server });

wss.on("connection", async (socket, request) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    const token = url.searchParams.get("token");

    if (!token) {
      socket.close(4001, "Authentication required");
      return;
    }

    const payload = jwt.verify(token, jwtSecret) as GatewayTokenPayload;
    const userResult = await pool.query<{ id: string; username: string }>(
      `
        select id, username
        from users
        where id = $1
        limit 1
      `,
      [payload.sub]
    );

    const user = userResult.rows[0];
    if (!user) {
      socket.close(4004, "Relay user not found");
      return;
    }

    const client: ClientContext = {
      socket,
      userId: user.id,
      username: user.username
    };

    clients.add(client);

    respond(socket, {
      type: "gateway.ready",
      payload: {
        user: {
          id: user.id,
          username: user.username
        }
      }
    });

    socket.on("message", (message) => {
      handleMessage(client, message).catch((error) => {
        console.error(error);
        sendError(socket, "Relay could not deliver that message.");
      });
    });

    socket.on("close", () => {
      clients.delete(client);
    });
  } catch {
    socket.close(4003, "Invalid Relay token");
  }
});

const start = async () => {
  await pool.query(RELAY_SCHEMA_SQL);
  await new Promise<void>((resolve) => {
    server.listen(port, "0.0.0.0", () => resolve());
  });
  console.log(`Relay gateway listening on ${port}`);
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
