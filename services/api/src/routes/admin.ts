import type { FastifyPluginAsync } from "fastify";
import { requireUser } from "../lib/auth.js";
import { getServerForUser, mapUserRow } from "../lib/bootstrap.js";
import { pool } from "../lib/db.js";

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get("/admin/overview", async (request, reply) => {
    const authUser = await requireUser(request, reply);
    if (!authUser) {
      return;
    }

    const server = await getServerForUser(pool, authUser.sub);
    if (!server || server.role !== "owner") {
      return reply.code(403).send({
        message: "Owner access is required."
      });
    }

    const [memberCountResult, ownerCountResult, messageCountResult, recentUsersResult] =
      await Promise.all([
        pool.query<{ count: string }>(
          `
            select count(*)::text as count
            from members
            where server_id = $1
          `,
          [server.id]
        ),
        pool.query<{ count: string }>(
          `
            select count(*)::text as count
            from members
            where server_id = $1 and role = 'owner'
          `,
          [server.id]
        ),
        pool.query<{ count: string }>(
          `
            select count(*)::text as count
            from messages msg
            inner join channels ch on ch.id = msg.channel_id
            where ch.server_id = $1
          `,
          [server.id]
        ),
        pool.query<{
          id: string;
          email: string;
          username: string;
          created_at: Date | string;
        }>(
          `
            select usr.id, usr.email, usr.username, usr.created_at
            from users usr
            inner join members mem on mem.user_id = usr.id
            where mem.server_id = $1
            order by mem.created_at desc
            limit 5
          `,
          [server.id]
        )
      ]);

    return {
      server,
      memberCount: Number(memberCountResult.rows[0]?.count ?? "0"),
      ownerCount: Number(ownerCountResult.rows[0]?.count ?? "0"),
      messageCount: Number(messageCountResult.rows[0]?.count ?? "0"),
      recentUsers: recentUsersResult.rows.map(mapUserRow)
    };
  });

  app.get("/admin/users", async (request, reply) => {
    const authUser = await requireUser(request, reply);
    if (!authUser) {
      return;
    }

    const server = await getServerForUser(pool, authUser.sub);
    if (!server || server.role !== "owner") {
      return reply.code(403).send({
        message: "Owner access is required."
      });
    }

    const result = await pool.query<{
      id: string;
      email: string;
      username: string;
      created_at: Date | string;
      role: "owner" | "member";
      joined_at: Date | string;
    }>(
      `
        select usr.id, usr.email, usr.username, usr.created_at, mem.role, mem.created_at as joined_at
        from users usr
        inner join members mem on mem.user_id = usr.id
        where mem.server_id = $1
        order by mem.created_at asc
      `,
      [server.id]
    );

    return result.rows.map((row) => ({
      ...mapUserRow(row),
      role: row.role,
      joinedAt: new Date(row.joined_at).toISOString()
    }));
  });
};
