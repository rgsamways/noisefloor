import cors from "@fastify/cors";
import Fastify from "fastify";
import { adminRoute } from "./routes/admin.js";
import { attemptsRoute } from "./routes/attempts.js";
import { authRoute } from "./routes/auth.js";
import { casesRoute } from "./routes/cases.js";
import { contactRoute } from "./routes/contact.js";
import { healthRoute } from "./routes/health.js";
import { sessionRoute } from "./routes/session.js";
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
  app.register(casesRoute);
  app.register(attemptsRoute);
  app.register(contactRoute);
  app.register(adminRoute);
  app.register(sessionRoute);
  return app;
}
