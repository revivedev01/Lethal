import type { RelaySDKContext } from "../types.js";

export const createGatewayModule = (context: RelaySDKContext) => ({
  async connect() {
    const token = context.requireToken();
    await context.gateway.connect(token);
  },

  disconnect() {
    context.gateway.disconnect();
  }
});

export type GatewayModule = ReturnType<typeof createGatewayModule>;
