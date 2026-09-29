import { and, eq, inArray, ne } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { user } from "../db/auth-schema.js";
import { db } from "../db/client.js";
import { entities, groupInvitations, groupMemberships, groups } from "../db/permissions-schema.js";
import { eodReports } from "../db/schema.js";
import { createTestSession } from "../test-utils/auth.js";

async function makeSiteAdmin(app: ReturnType<typeof buildApp>) {
  const { cookie, email, cleanup } = await createTestSession(app);
  const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  await db.update(user).set({ siteAdmin: true }).where(eq(user.id, testUser!.id));
  return { cookie, email, userId: testUser!.id, cleanup };
}

// Temporarily demotes every *other* siteAdmin so `userId` becomes the
// last one — restores their original flag afterward via `cleanups`, so
// this never permanently touches real siteAdmins from outside the test.
async function makeOnlySiteAdmin(userId: string, cleanups: Array<() => Promise<void>>) {
  const others = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.siteAdmin, true), ne(user.id, userId)));
  if (others.length === 0) return;

  const otherIds = others.map((o) => o.id);
  await db.update(user).set({ siteAdmin: false }).where(inArray(user.id, otherIds));
  cleanups.push(async () => {
    await db.update(user).set({ siteAdmin: true }).where(inArray(user.id, otherIds));
  });
}

async function makeGroup(cleanups: Array<() => Promise<void>>, name = `Test Group ${crypto.randomUUID()}`) {
  const [entity] = await db.select({ id: entities.id }).from(entities).limit(1);
  const [created] = await db.insert(groups).values({ entityId: entity!.id, name }).returning();
  cleanups.push(async () => {
    await db.delete(groups).where(eq(groups.id, created!.id));
  });
  return created!;
}

describe("admin routes", () => {
  const cleanups: Array<() => Promise<void>> = [];

  afterEach(async () => {
    for (const cleanup of cleanups.splice(0)) await cleanup();
  });

  describe("GET/POST /api/admin/groups", () => {
    it("rejects an unauthenticated request", async () => {
      const app = buildApp();
      const response = await app.inject({ method: "GET", url: "/api/admin/groups" });
      expect(response.statusCode).toBe(401);
    });

    it("rejects a non-siteAdmin request", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await createTestSession(app);
      cleanups.push(cleanup);
      const response = await app.inject({ method: "GET", url: "/api/admin/groups", headers: { cookie } });
      expect(response.statusCode).toBe(403);
    });

    it("lists groups with member counts", async () => {
      const app = buildApp();
      const { cookie, userId, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      await db.insert(groupMemberships).values({ userId, groupId: group.id });
      cleanups.push(async () => {
        await db.delete(groupMemberships).where(eq(groupMemberships.groupId, group.id));
      });

      const response = await app.inject({ method: "GET", url: "/api/admin/groups", headers: { cookie } });
      expect(response.statusCode).toBe(200);
      const body = response.json() as Array<{ id: string; memberCount: number }>;
      const found = body.find((g) => g.id === group.id);
      expect(found?.memberCount).toBe(1);
    });

    it("creates a group with a new name", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const name = `New Group ${crypto.randomUUID()}`;

      const response = await app.inject({ method: "POST", url: "/api/admin/groups", headers: { cookie }, payload: { name } });
      expect(response.statusCode).toBe(201);
      const created = response.json() as { id: string; name: string; memberCount: number };
      expect(created.name).toBe(name);
      expect(created.memberCount).toBe(0);
      cleanups.push(async () => {
        await db.delete(groups).where(eq(groups.id, created.id));
      });
    });

    it("rejects creating a duplicate group name with a conflict, not a raw db error", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);

      const response = await app.inject({ method: "POST", url: "/api/admin/groups", headers: { cookie }, payload: { name: group.name } });
      expect(response.statusCode).toBe(409);
    });
  });

  describe("GET /api/admin/groups/:groupId/members", () => {
    it("returns members joined with name/email, and pending invitations", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      const { email: memberEmail, userId: memberUserId, cleanup: memberCleanup } = await makeSiteAdmin(app);
      cleanups.push(memberCleanup);
      await db.insert(groupMemberships).values({ userId: memberUserId, groupId: group.id, tier: "t1", rules: ["view_stuff"] });
      await db.insert(groupInvitations).values({ groupId: group.id, email: "pending@example.com", invitedByUserId: "someone" });

      const response = await app.inject({ method: "GET", url: `/api/admin/groups/${group.id}/members`, headers: { cookie } });
      expect(response.statusCode).toBe(200);
      const body = response.json() as {
        members: Array<{ email: string; tier: string; rules: string[] }>;
        pendingInvitations: Array<{ email: string }>;
      };
      expect(body.members.find((m) => m.email === memberEmail)).toMatchObject({ tier: "t1", rules: ["view_stuff"] });
      expect(body.pendingInvitations.some((i) => i.email === "pending@example.com")).toBe(true);
    });
  });

  describe("POST /api/admin/groups/:groupId/invitations", () => {
    it("creates an immediate membership when the email already has an account", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      const { email: inviteeEmail, cleanup: inviteeCleanup } = await createTestSession(app);
      cleanups.push(inviteeCleanup);

      const response = await app.inject({
        method: "POST",
        url: `/api/admin/groups/${group.id}/invitations`,
        headers: { cookie },
        payload: { email: inviteeEmail },
      });
      expect(response.statusCode).toBe(201);
      const body = response.json() as { kind: string };
      expect(body.kind).toBe("membership");
    });

    it("creates a pending invitation when the email has no account", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      const email = `never-signed-in-${crypto.randomUUID()}@example.com`;

      const response = await app.inject({
        method: "POST",
        url: `/api/admin/groups/${group.id}/invitations`,
        headers: { cookie },
        payload: { email },
      });
      expect(response.statusCode).toBe(201);
      const body = response.json() as { kind: string; id: string };
      expect(body.kind).toBe("invitation");
      cleanups.push(async () => {
        await db.delete(groupInvitations).where(eq(groupInvitations.id, body.id));
      });
    });

    it("rejects an unknown rule key and creates no invitation or membership", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      const email = `bad-rule-invite-${crypto.randomUUID()}@example.com`;

      const response = await app.inject({
        method: "POST",
        url: `/api/admin/groups/${group.id}/invitations`,
        headers: { cookie },
        payload: { email, rules: ["not_a_real_rule"] },
      });
      expect(response.statusCode).toBe(400);

      const [invitation] = await db.select().from(groupInvitations).where(eq(groupInvitations.email, email));
      expect(invitation).toBeUndefined();
    });

    it("rejects inviting an email that already has a membership in this group", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      const { email: memberEmail, userId: memberUserId, cleanup: memberCleanup } = await makeSiteAdmin(app);
      cleanups.push(memberCleanup);
      await db.insert(groupMemberships).values({ userId: memberUserId, groupId: group.id });
      cleanups.push(async () => {
        await db.delete(groupMemberships).where(eq(groupMemberships.groupId, group.id));
      });

      const response = await app.inject({
        method: "POST",
        url: `/api/admin/groups/${group.id}/invitations`,
        headers: { cookie },
        payload: { email: memberEmail },
      });
      expect(response.statusCode).toBe(409);
    });

    it("rejects inviting an email that already has a pending invitation to the same group", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      const email = `dup-invite-${crypto.randomUUID()}@example.com`;
      const [invitation] = await db.insert(groupInvitations).values({ groupId: group.id, email, invitedByUserId: "someone" }).returning();
      cleanups.push(async () => {
        await db.delete(groupInvitations).where(eq(groupInvitations.id, invitation!.id));
      });

      const response = await app.inject({
        method: "POST",
        url: `/api/admin/groups/${group.id}/invitations`,
        headers: { cookie },
        payload: { email },
      });
      expect(response.statusCode).toBe(409);
    });
  });

  describe("POST /api/admin/groups/:groupId/memberships", () => {
    async function makeTargetUser() {
      const email = `member-${crypto.randomUUID()}@example.com`;
      const [created] = await db.insert(user).values({ id: crypto.randomUUID(), email, name: "Target" }).returning({ id: user.id });
      cleanups.push(async () => {
        await db.delete(user).where(eq(user.id, created!.id));
      });
      return { id: created!.id, email };
    }

    it("rejects unauthenticated and non-siteAdmin requests", async () => {
      const app = buildApp();
      const anon = await app.inject({ method: "POST", url: `/api/admin/groups/${crypto.randomUUID()}/memberships`, payload: {} });
      expect(anon.statusCode).toBe(401);

      const { cookie, cleanup } = await createTestSession(app);
      cleanups.push(cleanup);
      const nonAdmin = await app.inject({
        method: "POST",
        url: `/api/admin/groups/${crypto.randomUUID()}/memberships`,
        headers: { cookie },
        payload: { userId: "x" },
      });
      expect(nonAdmin.statusCode).toBe(403);
    });

    it("adds a non-member with rules and creates no invitation", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      const target = await makeTargetUser();

      const response = await app.inject({
        method: "POST",
        url: `/api/admin/groups/${group.id}/memberships`,
        headers: { cookie },
        payload: { userId: target.id, rules: ["view_own_tickets"] },
      });
      expect(response.statusCode).toBe(201);

      const memberships = await db.select().from(groupMemberships).where(eq(groupMemberships.groupId, group.id));
      expect(memberships).toHaveLength(1);
      expect(memberships[0]).toMatchObject({ userId: target.id, status: "active", rules: ["view_own_tickets"] });
      const invitations = await db.select({ id: groupInvitations.id }).from(groupInvitations).where(eq(groupInvitations.groupId, group.id));
      expect(invitations).toHaveLength(0);
    });

    it("reactivates a revoked member with replaced rules and no duplicate row", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      const target = await makeTargetUser();
      const [revoked] = await db
        .insert(groupMemberships)
        .values({ userId: target.id, groupId: group.id, rules: ["view_own_tickets"], status: "revoked" })
        .returning();

      const response = await app.inject({
        method: "POST",
        url: `/api/admin/groups/${group.id}/memberships`,
        headers: { cookie },
        payload: { userId: target.id, rules: ["escalate_ticket"] },
      });
      expect(response.statusCode).toBe(201);

      const memberships = await db.select().from(groupMemberships).where(eq(groupMemberships.groupId, group.id));
      expect(memberships).toHaveLength(1);
      expect(memberships[0]).toMatchObject({ id: revoked!.id, status: "active", rules: ["escalate_ticket"] });
    });

    it("returns 409 for an already-active member and leaves them unchanged", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      const target = await makeTargetUser();
      await db.insert(groupMemberships).values({ userId: target.id, groupId: group.id, rules: ["view_own_tickets"] });

      const response = await app.inject({
        method: "POST",
        url: `/api/admin/groups/${group.id}/memberships`,
        headers: { cookie },
        payload: { userId: target.id, rules: ["escalate_ticket"] },
      });
      expect(response.statusCode).toBe(409);

      const [row] = await db.select().from(groupMemberships).where(eq(groupMemberships.groupId, group.id));
      expect(row?.rules).toEqual(["view_own_tickets"]);
    });

    it("returns 404 for an unknown group and for an unknown user", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      const target = await makeTargetUser();

      const unknownGroup = await app.inject({
        method: "POST",
        url: `/api/admin/groups/${crypto.randomUUID()}/memberships`,
        headers: { cookie },
        payload: { userId: target.id },
      });
      expect(unknownGroup.statusCode).toBe(404);

      const unknownUser = await app.inject({
        method: "POST",
        url: `/api/admin/groups/${group.id}/memberships`,
        headers: { cookie },
        payload: { userId: "no-such-user" },
      });
      expect(unknownUser.statusCode).toBe(404);

      const rows = await db.select({ id: groupMemberships.id }).from(groupMemberships).where(eq(groupMemberships.groupId, group.id));
      expect(rows).toHaveLength(0);
    });

    it("rejects an invalid rule key", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      const target = await makeTargetUser();

      const response = await app.inject({
        method: "POST",
        url: `/api/admin/groups/${group.id}/memberships`,
        headers: { cookie },
        payload: { userId: target.id, rules: ["not_a_real_rule"] },
      });
      expect(response.statusCode).toBe(400);
    });
  });

  describe("DELETE /api/admin/groups/:groupId/invitations/:id", () => {
    it("cancels a pending invitation", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      const [invitation] = await db
        .insert(groupInvitations)
        .values({ groupId: group.id, email: "cancel-me@example.com", invitedByUserId: "someone" })
        .returning();

      const response = await app.inject({
        method: "DELETE",
        url: `/api/admin/groups/${group.id}/invitations/${invitation!.id}`,
        headers: { cookie },
      });
      expect(response.statusCode).toBe(204);
    });

    it("rejects cancelling an already-accepted invitation", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      const [invitation] = await db
        .insert(groupInvitations)
        .values({ groupId: group.id, email: "already-accepted@example.com", invitedByUserId: "someone", acceptedAt: new Date() })
        .returning();
      cleanups.push(async () => {
        await db.delete(groupInvitations).where(eq(groupInvitations.id, invitation!.id));
      });

      const response = await app.inject({
        method: "DELETE",
        url: `/api/admin/groups/${group.id}/invitations/${invitation!.id}`,
        headers: { cookie },
      });
      expect(response.statusCode).toBe(404);
    });
  });

  describe("PATCH /api/admin/groups/:groupId/memberships/:id", () => {
    it("updates rules without changing tier when tier is omitted", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      const { userId: memberUserId, cleanup: memberCleanup } = await makeSiteAdmin(app);
      cleanups.push(memberCleanup);
      const [membership] = await db
        .insert(groupMemberships)
        .values({ userId: memberUserId, groupId: group.id, tier: "t2", rules: ["view_own_tickets"] })
        .returning();

      const response = await app.inject({
        method: "PATCH",
        url: `/api/admin/groups/${group.id}/memberships/${membership!.id}`,
        headers: { cookie },
        payload: { rules: ["view_own_tickets", "escalate_ticket"] },
      });
      expect(response.statusCode).toBe(200);
      const body = response.json() as { tier: string; rules: string[] };
      expect(body.tier).toBe("t2");
      expect(body.rules).toEqual(["view_own_tickets", "escalate_ticket"]);
    });

    it("rejects an unknown rule key and leaves the existing rules unchanged", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      const { userId: memberUserId, cleanup: memberCleanup } = await makeSiteAdmin(app);
      cleanups.push(memberCleanup);
      const [membership] = await db
        .insert(groupMemberships)
        .values({ userId: memberUserId, groupId: group.id, rules: ["view_own_tickets"] })
        .returning();

      const response = await app.inject({
        method: "PATCH",
        url: `/api/admin/groups/${group.id}/memberships/${membership!.id}`,
        headers: { cookie },
        payload: { rules: ["not_a_real_rule"] },
      });
      expect(response.statusCode).toBe(400);

      const [reloaded] = await db.select().from(groupMemberships).where(eq(groupMemberships.id, membership!.id));
      expect(reloaded?.rules).toEqual(["view_own_tickets"]);
    });
  });

  describe("PATCH /api/admin/groups/:groupId/memberships/:id/revoke", () => {
    it("marks the membership revoked, not deleted", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      const { userId: memberUserId, cleanup: memberCleanup } = await makeSiteAdmin(app);
      cleanups.push(memberCleanup);
      const [membership] = await db.insert(groupMemberships).values({ userId: memberUserId, groupId: group.id }).returning();

      const response = await app.inject({
        method: "PATCH",
        url: `/api/admin/groups/${group.id}/memberships/${membership!.id}/revoke`,
        headers: { cookie },
      });
      expect(response.statusCode).toBe(200);

      const [reloaded] = await db.select().from(groupMemberships).where(eq(groupMemberships.id, membership!.id));
      expect(reloaded).toBeDefined();
      expect(reloaded?.status).toBe("revoked");
    });
  });

  describe("GET/PATCH /api/admin/users", () => {
    it("lists users with siteAdmin/siteRules, and a granted siteAdmin takes effect", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const { email: targetEmail, cleanup: targetCleanup } = await createTestSession(app);
      cleanups.push(targetCleanup);
      const [targetUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, targetEmail));
      const targetUserId = targetUser!.id;

      const listResponse = await app.inject({ method: "GET", url: "/api/admin/users", headers: { cookie } });
      expect(listResponse.statusCode).toBe(200);
      const users = listResponse.json() as Array<{ id: string; email: string; siteAdmin: boolean }>;
      expect(users.some((u) => u.email === targetEmail)).toBe(true);

      const patchResponse = await app.inject({
        method: "PATCH",
        url: `/api/admin/users/${targetUserId}`,
        headers: { cookie },
        payload: { siteAdmin: true },
      });
      expect(patchResponse.statusCode).toBe(200);

      const [reloaded] = await db.select({ siteAdmin: user.siteAdmin }).from(user).where(eq(user.id, targetUserId));
      expect(reloaded?.siteAdmin).toBe(true);
    });

    it("updates a user's name and title", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const { userId: targetUserId, cleanup: targetCleanup } = await makeSiteAdmin(app);
      cleanups.push(targetCleanup);

      const response = await app.inject({
        method: "PATCH",
        url: `/api/admin/users/${targetUserId}`,
        headers: { cookie },
        payload: { name: "Robin Samways", title: "T1" },
      });
      expect(response.statusCode).toBe(200);
      const body = response.json() as { name: string; title: string };
      expect(body.name).toBe("Robin Samways");
      expect(body.title).toBe("T1");
    });

    it("rejects removing siteAdmin from the last siteAdmin", async () => {
      const app = buildApp();
      const { cookie, userId, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      await makeOnlySiteAdmin(userId, cleanups);

      const response = await app.inject({
        method: "PATCH",
        url: `/api/admin/users/${userId}`,
        headers: { cookie },
        payload: { siteAdmin: false },
      });
      expect(response.statusCode).toBe(409);

      const [reloaded] = await db.select({ siteAdmin: user.siteAdmin }).from(user).where(eq(user.id, userId));
      expect(reloaded?.siteAdmin).toBe(true);
    });
  });

  describe("POST /api/admin/users", () => {
    function trackCreatedEmail(email: string) {
      cleanups.push(async () => {
        await db.delete(user).where(eq(user.email, email));
      });
    }

    it("rejects unauthenticated and non-siteAdmin requests", async () => {
      const app = buildApp();
      const anon = await app.inject({ method: "POST", url: "/api/admin/users", payload: { email: "a@example.com", name: "A" } });
      expect(anon.statusCode).toBe(401);

      const { cookie, cleanup } = await createTestSession(app);
      cleanups.push(cleanup);
      const nonAdmin = await app.inject({
        method: "POST",
        url: "/api/admin/users",
        headers: { cookie },
        payload: { email: "a@example.com", name: "A" },
      });
      expect(nonAdmin.statusCode).toBe(403);
    });

    it("rejects an invalid body", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const response = await app.inject({
        method: "POST",
        url: "/api/admin/users",
        headers: { cookie },
        payload: { email: "not-an-email", name: "" },
      });
      expect(response.statusCode).toBe(400);
    });

    it("creates an unverified user with no invitation", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const email = `created-${crypto.randomUUID()}@example.com`;
      trackCreatedEmail(email);

      const response = await app.inject({
        method: "POST",
        url: "/api/admin/users",
        headers: { cookie },
        payload: { email: email.toUpperCase(), name: "New Person", title: "T1" },
      });
      expect(response.statusCode).toBe(201);
      expect(response.json()).toMatchObject({ email, name: "New Person", title: "T1", siteAdmin: false });

      const [row] = await db.select().from(user).where(eq(user.email, email));
      expect(row?.emailVerified).toBe(false);
      expect(row?.title).toBe("T1");
      const invitations = await db.select({ id: groupInvitations.id }).from(groupInvitations).where(eq(groupInvitations.email, email));
      expect(invitations).toHaveLength(0);
    });

    it("returns 409 for an existing email, in any letter case", async () => {
      const app = buildApp();
      const { cookie, email, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);

      const response = await app.inject({
        method: "POST",
        url: "/api/admin/users",
        headers: { cookie },
        payload: { email: email.toUpperCase(), name: "Dup" },
      });
      expect(response.statusCode).toBe(409);
    });

    it("creates an active membership when an initial group is supplied", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      const email = `created-${crypto.randomUUID()}@example.com`;
      trackCreatedEmail(email);

      const response = await app.inject({
        method: "POST",
        url: "/api/admin/users",
        headers: { cookie },
        payload: { email, name: "Grouped", group: { groupId: group.id, tier: "T1", rules: [] } },
      });
      expect(response.statusCode).toBe(201);

      const memberships = await db.select().from(groupMemberships).where(eq(groupMemberships.groupId, group.id));
      expect(memberships).toHaveLength(1);
      expect(memberships[0]).toMatchObject({ userId: response.json().id, tier: "T1", status: "active" });
    });

    it("creates nothing for an unknown group or an invalid rule", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const group = await makeGroup(cleanups);
      const email = `created-${crypto.randomUUID()}@example.com`;
      trackCreatedEmail(email);

      const unknownGroup = await app.inject({
        method: "POST",
        url: "/api/admin/users",
        headers: { cookie },
        payload: { email, name: "X", group: { groupId: crypto.randomUUID() } },
      });
      expect(unknownGroup.statusCode).toBe(404);

      const badRule = await app.inject({
        method: "POST",
        url: "/api/admin/users",
        headers: { cookie },
        payload: { email, name: "X", group: { groupId: group.id, rules: ["not-a-real-rule"] } },
      });
      expect(badRule.statusCode).toBe(400);

      const rows = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
      expect(rows).toHaveLength(0);
    });

    it("lets a created user sign in by magic link into the same account", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const email = `created-${crypto.randomUUID()}@example.com`;
      trackCreatedEmail(email);

      const created = await app.inject({
        method: "POST",
        url: "/api/admin/users",
        headers: { cookie },
        payload: { email, name: "Later Signer" },
      });
      const createdId = created.json().id;

      await createTestSession(app, email);

      const rows = await db.select({ id: user.id, emailVerified: user.emailVerified }).from(user).where(eq(user.email, email));
      expect(rows).toHaveLength(1);
      expect(rows[0]?.id).toBe(createdId);
      expect(rows[0]?.emailVerified).toBe(true);
    });
  });

  describe("DELETE /api/admin/users/:id", () => {
    it("deletes a user, cascading their sessions and memberships", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const { userId: targetUserId } = await makeSiteAdmin(app);
      const group = await makeGroup(cleanups);
      await db.insert(groupMemberships).values({ userId: targetUserId, groupId: group.id });

      const response = await app.inject({ method: "DELETE", url: `/api/admin/users/${targetUserId}`, headers: { cookie } });
      expect(response.statusCode).toBe(204);

      const [reloadedUser] = await db.select({ id: user.id }).from(user).where(eq(user.id, targetUserId));
      expect(reloadedUser).toBeUndefined();
      const remainingMemberships = await db.select().from(groupMemberships).where(eq(groupMemberships.userId, targetUserId));
      expect(remainingMemberships).toHaveLength(0);
    });

    it("rejects deleting your own account", async () => {
      const app = buildApp();
      const { cookie, userId, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);

      const response = await app.inject({ method: "DELETE", url: `/api/admin/users/${userId}`, headers: { cookie } });
      expect(response.statusCode).toBe(409);

      const [reloaded] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId));
      expect(reloaded).toBeDefined();
    });
  });

  describe("GET /api/admin/eod-reports/:userId", () => {
    it("lets a siteAdmin read another user's filed reports", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const { email: targetEmail, cleanup: targetCleanup } = await createTestSession(app);
      cleanups.push(targetCleanup);
      const [targetUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, targetEmail));
      const targetUserId = targetUser!.id;
      const [report] = await db
        .insert(eodReports)
        .values({ userId: targetUserId, userEmail: targetEmail, reportDate: "2026-09-25", tickets: "fixed a radio" })
        .returning();
      cleanups.push(async () => {
        await db.delete(eodReports).where(eq(eodReports.id, report!.id));
      });

      const response = await app.inject({ method: "GET", url: `/api/admin/eod-reports/${targetUserId}`, headers: { cookie } });
      expect(response.statusCode).toBe(200);
      const body = response.json() as Array<{ tickets: string }>;
      expect(body[0]?.tickets).toBe("fixed a radio");
    });

    it("rejects a non-siteAdmin caller", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await createTestSession(app);
      cleanups.push(cleanup);

      const response = await app.inject({ method: "GET", url: "/api/admin/eod-reports/some-user-id", headers: { cookie } });
      expect(response.statusCode).toBe(403);
    });
  });

  // GET/PATCH /api/admin/settings is tested in eod-reports.test.ts, not
  // here — it mutates the same shared `entities.eodReportMode` singleton
  // row that eod-reports.test.ts's structured-mode tests do, and vitest
  // only serializes tests *within* a file by default; splitting them
  // across files reintroduces the exact cross-file race that grouping
  // them avoids.
});
