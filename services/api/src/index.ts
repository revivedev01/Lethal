import { buildApp } from "./app.js";
import { ensureSchema } from "./lib/db.js";

const port = Number(process.env.API_PORT ?? 4000);

const start = async () => {
  await ensureSchema();
  const app = buildApp();
  await app.listen({
    host: "0.0.0.0",
    port
  });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
