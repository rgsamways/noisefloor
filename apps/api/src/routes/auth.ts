import type { FastifyInstance } from "fastify";
import { auth } from "../auth.js";

export async function authRoute(app: FastifyInstance) {
  // better-auth needs the exact raw request bytes to validate its own body schema.
  // Fastify's default JSON parser would otherwise consume the stream and hand us an
  // already-parsed object, so override it here (scoped to this plugin's encapsulated
  // context only — the rest of the app keeps normal JSON body parsing).
  app.addContentTypeParser("application/json", { parseAs: "buffer" }, (_request, payload, done) => {
    done(null, payload);
  });

  app.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    handler: async (request, reply) => {
      const url = new URL(request.url, `${request.protocol}://${request.headers.host}`);
      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        if (value) headers.append(key, Array.isArray(value) ? value.join(", ") : value);
      }

      const req = new Request(url, {
        method: request.method,
        headers,
        body: request.body instanceof Buffer ? request.body : undefined,
      });

      const response = await auth.handler(req);

      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));
      reply.send(response.body ? Buffer.from(await response.arrayBuffer()) : null);
    },
  });
}
