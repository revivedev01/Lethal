import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { comparePassword, hashPassword, requireUser, signToken } from "../lib/auth.js";
import { ensureServerMembershipForUser, getServerSnapshotForUser, mapUserRow } from "../lib/bootstrap.js";
import { pool } from "../lib/db.js";

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  username: z
    .string()
    .trim()
    .min(2)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only use letters, numbers, and underscores."),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128)
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/signup", async (request, reply) => {
    const parsed = signupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        message: parsed.error.issues[0]?.message ?? "Unable to sign up with those details."
      });
    }

    const client = await pool.connect();

    try {
      await client.query("begin");

      const passwordHash = await hashPassword(parsed.data.password);

      const userResult = await client.query(
        `
          insert into users (email, username, password_hash)
          values ($1, $2, $3)
          returning id, email, username, created_at
        `,
        [parsed.data.email, parsed.data.username, passwordHash]
      );

      const user = mapUserRow(userResult.rows[0]);

      await ensureServerMembershipForUser(client, user.id);
      const snapshot = await getServerSnapshotForUser(client, user.id);

      await client.query("commit");

      return reply.code(201).send({
        token: signToken(user),
        user,
        ...snapshot
      });
    } catch (error) {
      await client.query("rollback");

      if (typeof error === "object" && error && "code" in error && error.code === "23505") {
        return reply.code(409).send({
          message: "That email or username is already in use."
        });
      }

      request.log.error(error);
      return reply.code(500).send({
        message: "Relay could not create that account right now."
      });
    } finally {
      client.release();
    }
  });

  app.post("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        message: parsed.error.issues[0]?.message ?? "Unable to log in with those details."
      });
    }

    const result = await pool.query<{
      id: string;
      email: string;
      username: string;
      password_hash: string;
      created_at: Date | string;
    }>(
      `
        select id, email, username, password_hash, created_at
        from users
        where email = $1
        limit 1
      `,
      [parsed.data.email]
    );

    const row = result.rows[0];
    if (!row) {
      return reply.code(401).send({
        message: "Incorrect email or password."
      });
    }

    const passwordValid = await comparePassword(parsed.data.password, row.password_hash);
    if (!passwordValid) {
      return reply.code(401).send({
        message: "Incorrect email or password."
      });
    }

    const user = mapUserRow(row);
    const snapshot = await getServerSnapshotForUser(pool, user.id);

    return {
      token: signToken(user),
      user,
      ...snapshot
    };
  });

  app.get("/auth/me", async (request, reply) => {
    const authUser = await requireUser(request, reply);
    if (!authUser) {
      return;
    }

    const result = await pool.query<{
      id: string;
      email: string;
      username: string;
      created_at: Date | string;
    }>(
      `
        select id, email, username, created_at
        from users
        where id = $1
        limit 1
      `,
      [authUser.sub]
    );

    if (!result.rows[0]) {
      return reply.code(404).send({
        message: "Relay user was not found."
      });
    }

    return mapUserRow(result.rows[0]);
  });
};
