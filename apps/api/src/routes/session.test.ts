import { ALL_GROUP_RULE_KEYS } from "@noisefloor/shared";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { user } from "../db/auth-schema.js";
import { db } from "../db/client.js";
import { entities, groupMemberships, groups } from "../db/permissions-schema.js";
import { createTestSession } from "../test-utils/auth.js";

async function makeGroup(cleanups: Array<() => Promise<void>>) {
  const [entity] = await db.insert(entities).values({ name: `Test Entity ${crypto.randomUUID()}` }).returning();
  const [group] = await db.insert(groups).values({ entityId: entity!.id, name: `Test Group ${crypto.randomUUID()}` }).returning();
  cleanups.push(async () => {
    await db.delete(entities).where(eq(entities.id, entity!.id));
  });
  return group!;
}

describe("GET /api/session", () => {
  const cleanups: Array<() => Promise<void>> = [];

  afterEach(async () => {
    for (const cleanup of cleanups.splice(0)) await cleanup();
  });

  it("rejects an unauthenticated request", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/session" });
    expect(response.statusCode).toBe(401);
  });

  it("returns the current siteAdmin/siteRules/groupRules for a signed-in user with no memberships", async () => {
    const app = buildApp();
    const { cookie, email, cleanup } = await createTestSession(app);
    try {
      const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
      await db.update(user).set({ siteAdmin: false, siteRules: ["manage_kb_content"] }).where(eq(user.id, testUser!.id));

      const response = await app.inject({ method: "GET", url: "/api/session", headers: { cookie } });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ siteAdmin: false, siteRules: ["manage_kb_content"], groupRules: [] });
    } finally {
      await cleanup();
    }
  });

  it("returns the union of rules from active memberships", async () => {
    const app = buildApp();
    const { cookie, email, cleanup } = await createTestSession(app);
    cleanups.push(cleanup);
    const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
    const groupA = await makeGroup(cleanups);
    const groupB = await makeGroup(cleanups);
    await db.insert(groupMemberships).values({ userId: testUser!.id, groupId: groupA.id, rules: ["view_own_tickets"] });
    await db.insert(groupMemberships).values({ userId: testUser!.id, groupId: groupB.id, rules: ["view_device_status"] });

    const response = await app.inject({ method: "GET", url: "/api/session", headers: { cookie } });
    expect(response.statusCode).toBe(200);
    expect(new Set(response.json().groupRules)).toEqual(new Set(["view_own_tickets", "view_device_status"]));
  });

  it("excludes a revoked membership's rules", async () => {
    const app = buildApp();
    const { cookie, email, cleanup } = await createTestSession(app);
    cleanups.push(cleanup);
    const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
    const group = await makeGroup(cleanups);
    await db.insert(groupMemberships).values({ userId: testUser!.id, groupId: group.id, rules: ["view_own_tickets"], status: "revoked" });

    const response = await app.inject({ method: "GET", url: "/api/session", headers: { cookie } });
    expect(response.statusCode).toBe(200);
    expect(response.json().groupRules).toEqual([]);
  });

  it("returns every catalog key for a siteAdmin regardless of memberships", async () => {
    const app = buildApp();
    const { cookie, email, cleanup } = await createTestSession(app);
    try {
      const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
      await db.update(user).set({ siteAdmin: true }).where(eq(user.id, testUser!.id));

      const response = await app.inject({ method: "GET", url: "/api/session", headers: { cookie } });
      expect(response.statusCode).toBe(200);
      expect(new Set(response.json().groupRules)).toEqual(new Set(ALL_GROUP_RULE_KEYS));
    } finally {
      await cleanup();
    }
  });
});
