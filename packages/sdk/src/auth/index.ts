import type { AuthResponse, User } from "@relay/config";
import { request } from "../lib/http.js";
import type { TokenStorage } from "../lib/storage.js";
import type { RelaySDKContext } from "../types.js";

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput extends LoginInput {
  username: string;
}

export const createAuthModule = (context: RelaySDKContext) => ({
  async login(input: LoginInput) {
    const response = await request<AuthResponse>(context.apiUrl, "/auth/login", {
      method: "POST",
      body: input
    });

    context.setToken(response.token);
    return response;
  },

  async signup(input: SignupInput) {
    const response = await request<AuthResponse>(context.apiUrl, "/auth/signup", {
      method: "POST",
      body: input
    });

    context.setToken(response.token);
    return response;
  },

  logout() {
    context.gateway.disconnect();
    context.clearToken();
  },

  getToken() {
    return context.storage.getItem(context.storageKey);
  }
});

export type AuthModule = ReturnType<typeof createAuthModule>;
export type RelaySessionUser = User;
export type RelayTokenStorage = TokenStorage;
