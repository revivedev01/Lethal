import {
  DEFAULT_CHANNELS,
  DEFAULT_SERVER_NAME,
  type Channel,
  type MemberRole,
  type Message,
  type Server,
  type User
} from "@relay/config";
import type { Pool, PoolClient } from "pg";

type Queryable = Pool | PoolClient;

interface UserRow {
  id: string;
  email: string;
  username: string;
  created_at: Date | string;
}

interface ServerRow {
  id: string;
  name: string;
  owner_id: string;
  created_at: Date | string;
  role: MemberRole;
}

interface ChannelRow {
  id: string;
  server_id: string;
  name: string;
  slug: string;
  created_at: Date | string;
}

interface MessageRow {
  id: string;
  content: string;
  user_id: string;
  channel_id: string;
  created_at: Date | string;
  username: string;
}

const toIso = (value: Date | string) => new Date(value).toISOString();

export const mapUserRow = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  username: row.username,
  createdAt: toIso(row.created_at)
});

export const mapServerRow = (row: ServerRow): Server => ({
  id: row.id,
  name: row.name,
  ownerId: row.owner_id,
  createdAt: toIso(row.created_at),
  role: row.role
});

export const mapChannelRow = (row: ChannelRow): Channel => ({
  id: row.id,
  serverId: row.server_id,
  name: row.name,
  slug: row.slug,
  createdAt: toIso(row.created_at)
});

export const mapMessageRow = (row: MessageRow): Message => ({
  id: row.id,
  content: row.content,
  userId: row.user_id,
  channelId: row.channel_id,
  createdAt: toIso(row.created_at),
  author: {
    id: row.user_id,
    username: row.username
  }
});

export const getServerForUser = async (
  db: Queryable,
  userId: string
): Promise<Server | null> => {
  const result = await db.query<ServerRow>(
    `
      select s.id, s.name, s.owner_id, s.created_at, m.role
      from servers s
      inner join members m on m.server_id = s.id
      where m.user_id = $1
      order by s.created_at asc
      limit 1
    `,
    [userId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapServerRow(result.rows[0]);
};

export const getChannelsForServer = async (
  db: Queryable,
  serverId: string
): Promise<Channel[]> => {
  const result = await db.query<ChannelRow>(
    `
      select id, server_id, name, slug, created_at
      from channels
      where server_id = $1
      order by created_at asc
    `,
    [serverId]
  );

  return result.rows.map(mapChannelRow);
};

export const getServerSnapshotForUser = async (db: Queryable, userId: string) => {
  const server = await getServerForUser(db, userId);
  if (!server) {
    return {
      server: null,
      channels: [] as Channel[]
    };
  }

  return {
    server,
    channels: await getChannelsForServer(db, server.id)
  };
};

export const ensureServerMembershipForUser = async (
  db: Queryable,
  userId: string
) => {
  const existingServer = await db.query<{ id: string }>(
    `
      select id
      from servers
      order by created_at asc
      limit 1
    `
  );

  if (!existingServer.rows[0]) {
    const serverResult = await db.query<{ id: string }>(
      `
        insert into servers (name, owner_id)
        values ($1, $2)
        returning id
      `,
      [DEFAULT_SERVER_NAME, userId]
    );

    const serverId = serverResult.rows[0].id;
    const role: MemberRole = "owner";

    await db.query(
      `
        insert into members (user_id, server_id, role)
        values ($1, $2, $3)
      `,
      [userId, serverId, role]
    );

    for (const channel of DEFAULT_CHANNELS) {
      await db.query(
        `
          insert into channels (server_id, name, slug)
          values ($1, $2, $3)
          on conflict (server_id, slug) do nothing
        `,
        [serverId, channel.name, channel.slug]
      );
    }

    return;
  }

  await db.query(
    `
      insert into members (user_id, server_id, role)
      values ($1, $2, $3)
      on conflict (user_id, server_id) do nothing
    `,
    [userId, existingServer.rows[0].id, "member"]
  );
};

export const listMessagesForChannel = async (
  db: Queryable,
  channelId: string,
  userId: string
) => {
  const result = await db.query<MessageRow>(
    `
      select msg.id, msg.content, msg.user_id, msg.channel_id, msg.created_at, usr.username
      from messages msg
      inner join users usr on usr.id = msg.user_id
      inner join channels ch on ch.id = msg.channel_id
      inner join members mem on mem.server_id = ch.server_id
      where msg.channel_id = $1 and mem.user_id = $2
      order by msg.created_at desc
      limit 100
    `,
    [channelId, userId]
  );

  return result.rows.reverse().map(mapMessageRow);
};
