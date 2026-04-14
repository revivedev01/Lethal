import type { FastifyPluginAsync } from "fastify";
import { requireUser } from "../lib/auth.js";
import { getChannelsForServer, getServerForUser } from "../lib/bootstrap.js";
import { pool } from "../lib/db.js";

export const serverRoutes: FastifyPluginAsync = async (app) => {
  app.get("/server/current", async (request, reply) => {
    const authUser = await requireUser(request, reply);
    if (!authUser) {
      return;
    }

    return getServerForUser(pool, authUser.sub);
  });

  app.get("/server/channels", async (request, reply) => {
    const authUser = await requireUser(request, reply);
    if (!authUser) {
      return;
    }

    const server = await getServerForUser(pool, authUser.sub);
    if (!server) {
      return [];
    }

    return getChannelsForServer(pool, server.id);
  });
};
