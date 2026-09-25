import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { user } from "../db/auth-schema.js";
import { db } from "../db/client.js";

// Drives the real magic-link sign-in flow against an in-process app (no
// network, no email service — sendMagicLink just logs the link when
// RESEND_API_KEY is unset) to get a genuine, better-auth-signed session
// cookie for `.inject()` tests, rather than hand-crafting one. Mirrors
// kerfy's apps/api/src/test-utils/auth.ts.
export async function createTestSession(app: FastifyInstance, overrideEmail?: string) {
  const email = overrideEmail ?? `test-${crypto.randomUUID()}@example.com`;

  const logSpy: string[] = [];
  const originalLog = console.log;
  console.log = (...logArgs: unknown[]) => {
    logSpy.push(logArgs.join(" "));
  };
  let signInResponse;
  try {
    signInResponse = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/magic-link",
      payload: { email },
    });
  } finally {
    console.log = originalLog;
  }

  if (signInResponse.statusCode !== 200) {
    throw new Error(`sign-in/magic-link failed: ${signInResponse.statusCode} ${signInResponse.body}`);
  }

  const linkLine = logSpy.find((line) => line.includes("[magic-link]"));
  const url = linkLine?.match(/https?:\/\/\S+/)?.[0];
  const token = url ? new URL(url).searchParams.get("token") : null;
  if (!token) {
    throw new Error(`Could not extract magic-link token from console output: ${JSON.stringify(logSpy)}`);
  }

  const verifyResponse = await app.inject({
    method: "GET",
    url: `/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`,
  });
  if (verifyResponse.statusCode !== 200) {
    throw new Error(`magic-link/verify failed: ${verifyResponse.statusCode} ${verifyResponse.body}`);
  }

  const setCookieHeader = verifyResponse.headers["set-cookie"];
  const setCookies = Array.isArray(setCookieHeader) ? setCookieHeader : setCookieHeader ? [setCookieHeader] : [];
  const cookie = setCookies.map((c) => c.split(";")[0]).join("; ");
  if (!cookie) {
    throw new Error("magic-link/verify did not set a session cookie");
  }

  async function cleanup() {
    await db.delete(user).where(eq(user.email, email));
  }

  return { cookie, email, cleanup };
}
