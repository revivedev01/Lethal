import type { RelayGatewayClient } from "./gateway/client.js";
import type { TokenStorage } from "./lib/storage.js";

export interface RelaySDKContext {
  apiUrl: string;
  storage: TokenStorage;
  storageKey: string;
  gateway: RelayGatewayClient;
  setToken(token: string): void;
  clearToken(): void;
  requireToken(): string;
}
