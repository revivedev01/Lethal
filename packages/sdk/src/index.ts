import { createAuthModule } from "./auth/index.js";
import { createAdminModule } from "./admin.js";
import { RelayGatewayClient } from "./gateway/client.js";
import { createGatewayModule } from "./gateway/index.js";
import { createBrowserStorage, type TokenStorage } from "./lib/storage.js";
import { createMessagesModule } from "./messages/index.js";
import { createServerModule } from "./server/index.js";
import type { RelaySDKContext } from "./types.js";
import { createUserModule } from "./user/index.js";

export interface RelaySDKOptions {
  apiUrl: string;
  gatewayUrl: string;
  storage?: TokenStorage;
  storageKey?: string;
}

export class RelaySDK {
  readonly auth;
  readonly user;
  readonly server;
  readonly messages;
  readonly gateway;
  readonly admin;

  private readonly context: RelaySDKContext;

  constructor(options: RelaySDKOptions) {
    const storageKey = options.storageKey ?? "relay.session.token";
    const storage = options.storage ?? createBrowserStorage();
    const gateway = new RelayGatewayClient(options.gatewayUrl);

    this.context = {
      apiUrl: options.apiUrl,
      storage,
      storageKey,
      gateway,
      setToken: (token) => storage.setItem(storageKey, token),
      clearToken: () => storage.removeItem(storageKey),
      requireToken: () => {
        const token = storage.getItem(storageKey);
        if (!token) {
          throw new Error("Relay session is not available.");
        }
        return token;
      }
    };

    this.auth = createAuthModule(this.context);
    this.user = createUserModule(this.context);
    this.server = createServerModule(this.context);
    this.messages = createMessagesModule(this.context);
    this.gateway = createGatewayModule(this.context);
    this.admin = createAdminModule(this.context);
  }
}

export const createRelaySDK = (options: RelaySDKOptions) => new RelaySDK(options);

export * from "@relay/config";
export * from "./auth/index.js";
export * from "./admin.js";
export * from "./lib/http.js";
