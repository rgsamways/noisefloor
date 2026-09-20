import type { FastifyReply, FastifyRequest } from "fastify";
import { auth } from "../auth.js";

// Mirrors routes/auth.ts's header conversion — Better Auth's server API
// wants a standard Headers object, not Fastify's raw header shape.
export async function getSession(request: FastifyRequest) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value) headers.append(key, Array.isArray(value) ? value.join(", ") : value);
  }
  return auth.api.getSession({ headers });
}

// No public/anonymous case-player routes in this slice (design.md
// non-goals) — every case/attempt route needs a session, so this shared
// guard 401s and returns undefined rather than each route repeating it.
export async function requireSession(request: FastifyRequest, reply: FastifyReply) {
  const session = await getSession(request);
  if (!session) {
    reply.status(401).send({ error: "unauthorized" });
    return undefined;
  }
  return session;
}
