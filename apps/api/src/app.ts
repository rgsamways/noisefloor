import cors from "@fastify/cors";
import Fastify from "fastify";
import { authRoute } from "./routes/auth.js";
import { healthRoute } from "./routes/health.js";
import { env } from "./env.js";

export function buildApp() {
  const app = Fastify({ logger: process.env.NODE_ENV !== "test" });
  // @fastify/cors defaults to methods: 'GET,HEAD,POST' — PUT/DELETE need to be
  // listed explicitly or their preflight requests get rejected.
  app.register(cors, {
    origin: env.WEB_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });
  app.register(healthRoute);
  app.register(authRoute);
  return app;
}
