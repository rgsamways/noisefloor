import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { user } from "../db/auth-schema.js";
import { db } from "../db/client.js";
import { entities, groupInvitations, groupMemberships, groups } from "../db/permissions-schema.js";
import { createTestSession } from "../test-utils/auth.js";
import { applyPendingGroupInvitations } from "./group-invitations.js";

async function makeGroup(cleanups: Array<() => Promise<void>>) {
  const [entity] = await db.insert(entities).values({ name: `Test Entity ${crypto.randomUUID()}` }).returning();
  const [group] = await db.insert(groups).values({ entityId: entity!.id, name: `Test Group ${crypto.randomUUID()}` }).returning();
  cleanups.push(async () => {
    await db.delete(entities).where(eq(entities.id, entity!.id));
  });
  return group!;
}

describe("applyPendingGroupInvitations", () => {
  const cleanups: Array<() => Promise<void>> = [];

  afterEach(async () => {
    for (const cleanup of cleanups.splice(0)) await cleanup();
  });

  it("converts a pending invitation into a membership and marks it accepted", async () => {
    const app = buildApp();
    const { email, cleanup } = await createTestSession(app);
    cleanups.push(cleanup);
    const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
    const group = await makeGroup(cleanups);

    const [invitation] = await db
      .insert(groupInvitations)
      .values({ groupId: group.id, email: email.toUpperCase(), tier: "t1", rules: ["view_stuff"], invitedByUserId: "someone" })
      .returning();

    await applyPendingGroupInvitations(testUser!.id, email);

    const [membership] = await db
      .select()
      .from(groupMemberships)
      .where(eq(groupMemberships.userId, testUser!.id));
    expect(membership?.groupId).toBe(group.id);
    expect(membership?.tier).toBe("t1");
    expect(membership?.rules).toEqual(["view_stuff"]);

    const [reloadedInvitation] = await db.select().from(groupInvitations).where(eq(groupInvitations.id, invitation!.id));
    expect(reloadedInvitation?.acceptedAt).not.toBeNull();
  });

  it("is a no-op the second time (self-limiting)", async () => {
    const app = buildApp();
    const { email, cleanup } = await createTestSession(app);
    cleanups.push(cleanup);
    const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
    const group = await makeGroup(cleanups);

    await db.insert(groupInvitations).values({ groupId: group.id, email, tier: null, rules: [], invitedByUserId: "someone" });

    await applyPendingGroupInvitations(testUser!.id, email);
    await applyPendingGroupInvitations(testUser!.id, email);

    const memberships = await db.select().from(groupMemberships).where(eq(groupMemberships.userId, testUser!.id));
    expect(memberships).toHaveLength(1);
  });
});
