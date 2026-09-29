// Must run before any other import — env.ts reads process.env at module
// load time, and this is the only entry point that ever loaded .env at
// all (drizzle.config.ts loads it separately for CLI commands; nothing
// wired it into the running server, which is why unset vars silently
// fell back to env.ts's defaults instead of reading .env).
import "dotenv/config";
import { buildApp } from "./app.js";
import { env } from "./env.js";

const app = buildApp();

app.listen({ port: env.PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
