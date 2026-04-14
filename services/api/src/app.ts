import cors from "@fastify/cors";
import Fastify from "fastify";
import { adminRoutes } from "./routes/admin.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { messageRoutes } from "./routes/messages.js";
import { serverRoutes } from "./routes/server.js";

export const buildApp = () => {
  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: true
  });

  app.register(healthRoutes);
  app.register(authRoutes);
  app.register(serverRoutes);
  app.register(messageRoutes);
  app.register(adminRoutes);

  return app;
};
