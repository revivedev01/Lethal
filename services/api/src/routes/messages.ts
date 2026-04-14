import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { requireUser } from "../lib/auth.js";
import { listMessagesForChannel } from "../lib/bootstrap.js";
import { pool } from "../lib/db.js";

const messageQuerySchema = z.object({
  channelId: z.string().uuid()
});

export const messageRoutes: FastifyPluginAsync = async (app) => {
  app.get("/messages", async (request, reply) => {
    const authUser = await requireUser(request, reply);
    if (!authUser) {
      return;
    }

    const parsed = messageQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        message: "A valid channelId is required."
      });
    }

    return listMessagesForChannel(pool, parsed.data.channelId, authUser.sub);
  });
};
