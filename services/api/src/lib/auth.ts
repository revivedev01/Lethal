import type { FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  username: string;
}

const jwtSecret = process.env.JWT_SECRET ?? "relay-dev-secret";

export const hashPassword = async (password: string) => bcrypt.hash(password, 12);
export const comparePassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export const signToken = (user: {
  id: string;
  email: string;
  username: string;
}) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username
    },
    jwtSecret,
    {
      expiresIn: "30d"
    }
  );

export const verifyToken = (token: string) =>
  jwt.verify(token, jwtSecret) as AuthTokenPayload;

export const requireUser = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<AuthTokenPayload | null> => {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    await reply.code(401).send({ message: "Authentication is required." });
    return null;
  }

  const token = header.slice("Bearer ".length);

  try {
    return verifyToken(token);
  } catch {
    await reply.code(401).send({ message: "Your Relay session is invalid or expired." });
    return null;
  }
};
