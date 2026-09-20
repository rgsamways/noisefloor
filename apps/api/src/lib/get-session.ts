import type { FastifyRequest } from "fastify";
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
