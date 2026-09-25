import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { user } from "../db/auth-schema.js";
import { db } from "../db/client.js";
import { entities, groupMemberships, groups } from "../db/permissions-schema.js";
import { createTestSession } from "../test-utils/auth.js";
import { hasGroupRule } from "./group-authorization.js";

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
