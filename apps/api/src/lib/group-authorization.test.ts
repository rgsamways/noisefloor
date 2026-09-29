import { ALL_GROUP_RULE_KEYS } from "@noisefloor/shared";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { user } from "../db/auth-schema.js";
import { db } from "../db/client.js";
import { entities, groupMemberships, groups } from "../db/permissions-schema.js";
import { createTestSession } from "../test-utils/auth.js";
import { getMyGroupRules, hasGroupRule, requireGroupRule } from "./group-authorization.js";

// Deleting the entity cascades to the group (and the group's memberships),
// so registering just the entity's cleanup is enough.
async function makeGroup(cleanups: Array<() => Promise<void>>) {
  const [entity] = await db.insert(entities).values({ name: `Test Entity ${crypto.randomUUID()}` }).returning();
  const [group] = await db.insert(groups).values({ entityId: entity!.id, name: `Test Group ${crypto.randomUUID()}` }).returning();
  cleanups.push(async () => {
    await db.delete(entities).where(eq(entities.id, entity!.id));
  });
  return group!;
}

describe("hasGroupRule", () => {
  const cleanups: Array<() => Promise<void>> = [];

  afterEach(async () => {
    for (const cleanup of cleanups.splice(0)) await cleanup();
  });

  it("bypasses for a siteAdmin identity with no membership at all", async () => {
    const group = await makeGroup(cleanups);
    expect(await hasGroupRule("some-nonexistent-user-id", group.id, "view_stuff", true)).toBe(true);
  });

  it("passes for an active membership that holds the rule", async () => {
    const app = buildApp();
    const { email, cleanup } = await createTestSession(app);
    cleanups.push(cleanup);
    const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
    const group = await makeGroup(cleanups);
    await db.insert(groupMemberships).values({ userId: testUser!.id, groupId: group.id, rules: ["view_stuff"] });

    expect(await hasGroupRule(testUser!.id, group.id, "view_stuff", false)).toBe(true);
  });

  it("fails for an active membership that doesn't hold the rule", async () => {
    const app = buildApp();
    const { email, cleanup } = await createTestSession(app);
    cleanups.push(cleanup);
    const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
    const group = await makeGroup(cleanups);
    await db.insert(groupMemberships).values({ userId: testUser!.id, groupId: group.id, rules: [] });

    expect(await hasGroupRule(testUser!.id, group.id, "view_stuff", false)).toBe(false);
  });

  it("fails for a revoked membership even if its rules include the rule", async () => {
    const app = buildApp();
    const { email, cleanup } = await createTestSession(app);
    cleanups.push(cleanup);
    const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
    const group = await makeGroup(cleanups);
    await db.insert(groupMemberships).values({ userId: testUser!.id, groupId: group.id, rules: ["view_stuff"], status: "revoked" });

    expect(await hasGroupRule(testUser!.id, group.id, "view_stuff", false)).toBe(false);
  });
});

describe("getMyGroupRules", () => {
  const cleanups: Array<() => Promise<void>> = [];

  afterEach(async () => {
    for (const cleanup of cleanups.splice(0)) await cleanup();
  });

  it("unions rules across multiple active memberships without duplicates", async () => {
    const app = buildApp();
    const { email, cleanup } = await createTestSession(app);
    cleanups.push(cleanup);
    const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
    const groupA = await makeGroup(cleanups);
    const groupB = await makeGroup(cleanups);
    await db.insert(groupMemberships).values({ userId: testUser!.id, groupId: groupA.id, rules: ["view_stuff", "edit_stuff"] });
    await db.insert(groupMemberships).values({ userId: testUser!.id, groupId: groupB.id, rules: ["edit_stuff", "delete_stuff"] });

    const result = await getMyGroupRules(testUser!.id, false);
    expect(new Set(result)).toEqual(new Set(["view_stuff", "edit_stuff", "delete_stuff"]));
  });

  it("excludes a revoked membership's rules", async () => {
    const app = buildApp();
    const { email, cleanup } = await createTestSession(app);
    cleanups.push(cleanup);
    const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
    const group = await makeGroup(cleanups);
    await db.insert(groupMemberships).values({ userId: testUser!.id, groupId: group.id, rules: ["view_stuff"], status: "revoked" });

    expect(await getMyGroupRules(testUser!.id, false)).toEqual([]);
  });

  it("returns every catalog key for a siteAdmin regardless of memberships", async () => {
    const result = await getMyGroupRules("some-nonexistent-user-id", true);
    expect(result).toEqual([...ALL_GROUP_RULE_KEYS]);
  });
});

describe("requireGroupRule", () => {
  it("401s an unauthenticated request", async () => {
    const app = buildApp();
    app.get("/__test_only_group_rule", { preHandler: requireGroupRule("view_stuff") }, async () => ({ ok: true }));

    const response = await app.inject({ method: "GET", url: "/__test_only_group_rule" });
    expect(response.statusCode).toBe(401);
  });

  it("403s a signed-in caller who doesn't hold the rule", async () => {
    const app = buildApp();
    app.get("/__test_only_group_rule", { preHandler: requireGroupRule("view_stuff") }, async () => ({ ok: true }));
    const { cookie, cleanup } = await createTestSession(app);
    try {
      const response = await app.inject({ method: "GET", url: "/__test_only_group_rule", headers: { cookie } });
      expect(response.statusCode).toBe(403);
    } finally {
      await cleanup();
    }
  });

  it("passes a signed-in caller who holds the rule via an active membership", async () => {
    const app = buildApp();
    app.get("/__test_only_group_rule", { preHandler: requireGroupRule("view_stuff") }, async () => ({ ok: true }));
    const { cookie, email, cleanup } = await createTestSession(app);
    const cleanups: Array<() => Promise<void>> = [];
    try {
      const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
      const group = await makeGroup(cleanups);
      await db.insert(groupMemberships).values({ userId: testUser!.id, groupId: group.id, rules: ["view_stuff"] });

      const response = await app.inject({ method: "GET", url: "/__test_only_group_rule", headers: { cookie } });
      expect(response.statusCode).toBe(200);
    } finally {
      for (const c of cleanups.splice(0)) await c();
      await cleanup();
    }
  });

  it("passes a siteAdmin caller regardless of memberships", async () => {
    // Unlike the other requireGroupRule tests, siteAdmin's bypass returns
    // the real catalog keys (getMyGroupRules), not whatever arbitrary
    // string was checked — so this one needs an actual catalog key.
    const app = buildApp();
    app.get("/__test_only_group_rule", { preHandler: requireGroupRule("view_device_status") }, async () => ({ ok: true }));
    const { cookie, email, cleanup } = await createTestSession(app);
    try {
      await db.update(user).set({ siteAdmin: true }).where(eq(user.email, email));
      const response = await app.inject({ method: "GET", url: "/__test_only_group_rule", headers: { cookie } });
      expect(response.statusCode).toBe(200);
    } finally {
      await cleanup();
    }
  });
});
