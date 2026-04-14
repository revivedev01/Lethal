import type { User } from "@relay/config";
import { request } from "../lib/http.js";
import type { RelaySDKContext } from "../types.js";

export const createUserModule = (context: RelaySDKContext) => ({
  async getCurrentUser() {
    const token = context.requireToken();
    return request<User>(context.apiUrl, "/auth/me", { token });
  }
});

export type UserModule = ReturnType<typeof createUserModule>;
