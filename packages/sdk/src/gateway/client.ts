import type { GatewayClientEvent, GatewayServerEvent, Message } from "@relay/config";

type MessageHandler = (message: Message) => void;

export class RelayGatewayClient {
  private socket: WebSocket | null = null;
  private openPromise: Promise<void> | null = null;
  private listeners = new Set<MessageHandler>();

  constructor(private readonly gatewayUrl: string) {}

  async connect(token: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.openPromise) {
      await this.openPromise;
      return;
    }

    const delimiter = this.gatewayUrl.includes("?") ? "&" : "?";
    const url = `${this.gatewayUrl}${delimiter}token=${encodeURIComponent(token)}`;

    const connectionPromise = new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url);

      socket.addEventListener("open", () => {
        this.socket = socket;
        resolve();
      });

      socket.addEventListener("message", (event) => {
        const parsed = JSON.parse(event.data as string) as GatewayServerEvent;
        if (parsed.type === "message.created") {
          this.listeners.forEach((listener) => listener(parsed.payload));
        }
      });

      socket.addEventListener("close", () => {
        this.socket = null;
        this.openPromise = null;
      });

      socket.addEventListener("error", () => {
        this.openPromise = null;
        reject(new Error("Unable to connect to Relay gateway."));
      });
    });

    this.openPromise = connectionPromise;
    await connectionPromise;
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
    this.openPromise = null;
  }

  send(event: GatewayClientEvent) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("Relay gateway is not connected.");
    }

    this.socket.send(JSON.stringify(event));
  }

  subscribe(listener: MessageHandler) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
