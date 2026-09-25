import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { db } from "../db/client.js";
import { entities, groupInvitations, groupMemberships, groups } from "../db/permissions-schema.js";
import { createTestSession } from "../test-utils/auth.js";
import { requireSession } from "./get-session.js";

describe("getSession", () => {
  it("converts a pending group invitation into a membership once the session is resolved", async () => {
    const email = `test-invited-${crypto.randomUUID()}@example.com`;
    const [entity] = await db.insert(entities).values({ name: `Test Entity ${crypto.randomUUID()}` }).returning();
    const [group] = await db.insert(groups).values({ entityId: entity!.id, name: `Test Group ${crypto.randomUUID()}` }).returning();
    await db
      .insert(groupInvitations)
      .values({ groupId: group!.id, email, tier: "t1", rules: ["view_stuff"], invitedByUserId: "someone" });

    const app = buildApp();
    // Signing in alone doesn't run our getSession wrapper — only an
    // authenticated request through a route that calls it does. Register
    // a throwaway route just to trigger that resolution, same as
    // site-admin.test.ts.
    app.get("/__test_only_resolve_session", { preHandler: requireSession }, async () => ({ ok: true }));
    const { cookie, cleanup } = await createTestSession(app, email);
    try {
      const response = await app.inject({ method: "GET", url: "/__test_only_resolve_session", headers: { cookie } });
      expect(response.statusCode).toBe(200);

      const memberships = await db.select().from(groupMemberships).where(eq(groupMemberships.groupId, group!.id));
      expect(memberships).toHaveLength(1);
      expect(memberships[0]?.tier).toBe("t1");
      expect(memberships[0]?.rules).toEqual(["view_stuff"]);
    } finally {
      await cleanup();
      await db.delete(entities).where(eq(entities.id, entity!.id));
    }
  });
});
