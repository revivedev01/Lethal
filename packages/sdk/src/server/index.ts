import type { Channel, Server } from "@relay/config";
import { request } from "../lib/http.js";
import type { RelaySDKContext } from "../types.js";

export const createServerModule = (context: RelaySDKContext) => ({
  async getServer() {
    const token = context.requireToken();
    return request<Server | null>(context.apiUrl, "/server/current", { token });
  },

  async getChannels() {
    const token = context.requireToken();
    return request<Channel[]>(context.apiUrl, "/server/channels", { token });
  }
});

export type ServerModule = ReturnType<typeof createServerModule>;
