import type { Message } from "@relay/config";
import { request } from "../lib/http.js";
import type { RelaySDKContext } from "../types.js";

export const createMessagesModule = (context: RelaySDKContext) => ({
  async listMessages(channelId: string) {
    const token = context.requireToken();
    const search = new URLSearchParams({ channelId });
    return request<Message[]>(context.apiUrl, `/messages?${search.toString()}`, { token });
  },

  async sendMessage(channelId: string, content: string) {
    const token = context.requireToken();
    await context.gateway.connect(token);
    context.gateway.send({
      type: "message.send",
      payload: {
        channelId,
        content
      }
    });
  },

  subscribeToMessages(channelId: string, listener: (message: Message) => void) {
    return context.gateway.subscribe((message) => {
      if (message.channelId === channelId) {
        listener(message);
      }
    });
  }
});

export type MessagesModule = ReturnType<typeof createMessagesModule>;
