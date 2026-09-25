import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { user } from "./auth-schema.js";
import { db } from "./client.js";
import { entities, groupMemberships, groups } from "./permissions-schema.js";
import { createTestSession } from "../test-utils/auth.js";

describe("entities and groups", () => {
  const cleanups: Array<() => Promise<void>> = [];

  afterEach(async () => {
    for (const cleanup of cleanups.splice(0)) await cleanup();
  });

  async function makeEntity() {
    const [entity] = await db.insert(entities).values({ name: `Test Entity ${crypto.randomUUID()}` }).returning();
    cleanups.push(async () => {
      await db.delete(entities).where(eq(entities.id, entity!.id));
    });
    return entity!;
  }

  it("creates an entity with just a name", async () => {
    const entity = await makeEntity();
    expect(entity.name).toBeTruthy();
  });

  it("creates a group under an entity", async () => {
    const entity = await makeEntity();
    const [group] = await db.insert(groups).values({ entityId: entity.id, name: "Support" }).returning();
    expect(group?.entityId).toBe(entity.id);
  });

  it("rejects a duplicate group name under the same entity", async () => {
    const entity = await makeEntity();
    await db.insert(groups).values({ entityId: entity.id, name: "Support" });
    await expect(db.insert(groups).values({ entityId: entity.id, name: "Support" })).rejects.toThrow();
  });

  it("allows the same group name under a different entity", async () => {
    const entityA = await makeEntity();
    const entityB = await makeEntity();
    await db.insert(groups).values({ entityId: entityA.id, name: "Support" });
    await expect(db.insert(groups).values({ entityId: entityB.id, name: "Support" })).resolves.not.toThrow();
  });
});

describe("group memberships", () => {
  const cleanups: Array<() => Promise<void>> = [];

  afterEach(async () => {
    for (const cleanup of cleanups.splice(0)) await cleanup();
  });

  async function makeGroup() {
    const [entity] = await db.insert(entities).values({ name: `Test Entity ${crypto.randomUUID()}` }).returning();
    const [group] = await db.insert(groups).values({ entityId: entity!.id, name: "Support" }).returning();
    cleanups.push(async () => {
      await db.delete(entities).where(eq(entities.id, entity!.id));
    });
    return group!;
  }

  async function makeTestUser() {
    const app = buildApp();
    const { email, cleanup } = await createTestSession(app);
    cleanups.push(cleanup);
    const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
    return testUser!;
  }

  it("creates a membership with a tier and a rule set", async () => {
    const group = await makeGroup();
    const testUser = await makeTestUser();
    const [membership] = await db
      .insert(groupMemberships)
      .values({ userId: testUser.id, groupId: group.id, tier: "t1", rules: ["view_stuff"] })
      .returning();
    expect(membership?.tier).toBe("t1");
    expect(membership?.rules).toEqual(["view_stuff"]);
  });

  it("can update rules without changing tier", async () => {
    const group = await makeGroup();
    const testUser = await makeTestUser();
    const [membership] = await db
      .insert(groupMemberships)
      .values({ userId: testUser.id, groupId: group.id, tier: "t2", rules: ["view_stuff"] })
      .returning();

    await db.update(groupMemberships).set({ rules: ["view_stuff", "edit_stuff"] }).where(eq(groupMemberships.id, membership!.id));

    const [reloaded] = await db.select().from(groupMemberships).where(eq(groupMemberships.id, membership!.id));
    expect(reloaded?.tier).toBe("t2");
    expect(reloaded?.rules).toEqual(["view_stuff", "edit_stuff"]);
  });

  it("rejects a second membership for the same user and group", async () => {
    const group = await makeGroup();
    const testUser = await makeTestUser();
    await db.insert(groupMemberships).values({ userId: testUser.id, groupId: group.id });
    await expect(db.insert(groupMemberships).values({ userId: testUser.id, groupId: group.id })).rejects.toThrow();
  });

  it("keeps a revoked membership's row queryable rather than deleting it", async () => {
    const group = await makeGroup();
    const testUser = await makeTestUser();
    const [membership] = await db.insert(groupMemberships).values({ userId: testUser.id, groupId: group.id }).returning();

    await db.update(groupMemberships).set({ status: "revoked" }).where(eq(groupMemberships.id, membership!.id));

    const [reloaded] = await db.select().from(groupMemberships).where(eq(groupMemberships.id, membership!.id));
    expect(reloaded).toBeDefined();
    expect(reloaded?.status).toBe("revoked");
  });
});
