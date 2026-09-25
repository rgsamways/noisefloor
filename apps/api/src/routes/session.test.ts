import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { user } from "../db/auth-schema.js";
import { db } from "../db/client.js";
import { createTestSession } from "../test-utils/auth.js";

describe("GET /api/session", () => {
  it("rejects an unauthenticated request", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/session" });
    expect(response.statusCode).toBe(401);
  });

  it("returns the current siteAdmin/siteRules for a signed-in user", async () => {
    const app = buildApp();
    const { cookie, email, cleanup } = await createTestSession(app);
    try {
      const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
      await db.update(user).set({ siteAdmin: true, siteRules: ["manage_kb_content"] }).where(eq(user.id, testUser!.id));

      const response = await app.inject({ method: "GET", url: "/api/session", headers: { cookie } });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ siteAdmin: true, siteRules: ["manage_kb_content"] });
    } finally {
      await cleanup();
    }
  });
});
