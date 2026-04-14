import type { AdminOverview, AdminUserRow } from "@relay/config";
import { request } from "./lib/http.js";
import type { RelaySDKContext } from "./types.js";

export const createAdminModule = (context: RelaySDKContext) => ({
  async getOverview() {
    const token = context.requireToken();
    return request<AdminOverview>(context.apiUrl, "/admin/overview", { token });
  },

  async listUsers() {
    const token = context.requireToken();
    return request<AdminUserRow[]>(context.apiUrl, "/admin/users", { token });
  }
});

export type AdminModule = ReturnType<typeof createAdminModule>;
