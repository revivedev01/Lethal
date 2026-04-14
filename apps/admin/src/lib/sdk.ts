import { createRelaySDK } from "@relay/sdk";

export const sdk = createRelaySDK({
  apiUrl: import.meta.env.VITE_RELAY_API_URL ?? "http://localhost:4000",
  gatewayUrl: import.meta.env.VITE_RELAY_GATEWAY_URL ?? "ws://localhost:4001",
  storageKey: "relay.admin.session.token"
});
