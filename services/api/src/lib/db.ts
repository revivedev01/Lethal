import { RELAY_SCHEMA_SQL } from "@relay/config";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/relay";

const useSsl =
  process.env.DATABASE_SSL === "true" ||
  (!connectionString.includes("localhost") && !connectionString.includes("127.0.0.1"));

export const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined
});

let schemaPromise: Promise<void> | null = null;

export const ensureSchema = async () => {
  if (!schemaPromise) {
    schemaPromise = pool.query(RELAY_SCHEMA_SQL).then(() => undefined);
  }

  await schemaPromise;
};
