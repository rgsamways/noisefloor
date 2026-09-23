import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sendContactEmail } from "../lib/send-contact-email.js";

const contactBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email().max(320),
  message: z.string().trim().min(1).max(5000),
  // Hidden field real visitors never fill in; bots that autofill every
  // input trip it. No length limit here — a non-empty value should still
  // parse successfully so the route can silently no-op instead of
  // returning a 400 that would tip off the bot it was detected.
  website: z.string().optional().default(""),
});

export async function contactRoute(app: FastifyInstance) {
  // In-memory store, single-instance scale — matches R8's "everything within
  // hobby-tier limits" framing, no Redis or other infra needed for this.
  await app.register(import("@fastify/rate-limit"), { global: false });

  app.post(
    "/contact",
    { config: { rateLimit: { max: 5, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const parsed = contactBodySchema.safeParse(request.body);
      if (!parsed.success) {
        reply.status(400).send({ error: "invalid contact form submission" });
        return;
      }

      const { name, email, message, website } = parsed.data;
      if (website) {
        // Honeypot tripped — report success without sending anything, so
        // the bot doesn't learn its submission was rejected.
        return { status: "ok" };
      }

      await sendContactEmail({ name, email, message });
      return { status: "ok" };
    },
  );
}
