import { groupRuleKeySchema } from "@noisefloor/shared";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { auth } from "../auth.js";
import { user } from "../db/auth-schema.js";
import { db } from "../db/client.js";
import { entities, groupInvitations, groupMemberships, groups } from "../db/permissions-schema.js";
import { eodReports } from "../db/schema.js";
import { isBootstrapSiteAdminEmail } from "../lib/bootstrap-site-admin.js";
import { getEodReportMode, setEodReportMode } from "../lib/eod-report-mode.js";
import { getSession } from "../lib/get-session.js";
import { sendInviteEmail } from "../lib/send-invite-email.js";
import { requireSiteAdmin } from "../lib/site-admin.js";

// Every route here is gated by requireSiteAdmin alone — no delegation
// model exists yet (design.md's Decision 2, mirroring kerfy's own
// admin-console.ts). Resolves "the" entity server-side rather than
// taking an entityId from the client — there's exactly one, seeded by
// migration (Decision 1).
async function resolveEntityId(): Promise<string> {
  const [entity] = await db.select({ id: entities.id }).from(entities).limit(1);
  if (!entity) throw new Error("no entity seeded");
  return entity.id;
}

const CreateGroupBody = z.object({ name: z.string().min(1) });
const InviteBody = z.object({
  email: z.string().email(),
  tier: z.string().nullable().optional(),
  rules: z.array(groupRuleKeySchema).optional(),
});
const AddMemberBody = z.object({
  userId: z.string().min(1),
  rules: z.array(groupRuleKeySchema).optional(),
});
const UpdateMembershipBody = z.object({
  tier: z.string().nullable().optional(),
  rules: z.array(groupRuleKeySchema).optional(),
});
const UpdateSettingsBody = z.object({ eodReportMode: z.enum(["freeform", "structured"]) });
const CreateUserBody = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  title: z.string().nullable().optional(),
  group: z
    .object({
      groupId: z.string().min(1),
      tier: z.string().nullable().optional(),
      rules: z.array(groupRuleKeySchema).optional(),
    })
    .optional(),
});
const UpdateUserBody = z.object({
  name: z.string().min(1).optional(),
  title: z.string().nullable().optional(),
  siteAdmin: z.boolean().optional(),
  siteRules: z.array(z.string()).optional(),
});

// Guards the siteAdmin-toggle PATCH against self-demoting the last
// siteAdmin (design.md's Decision 1) — the only reachable way to zero
// out siteAdmin, since a delete can't: the caller is always a siteAdmin
// distinct from a delete target (self-delete is blocked separately), so
// the caller alone always keeps the post-delete count at least 1.
// Counts every *other* siteAdmin, so it correctly allows demoting
// someone else while a different siteAdmin still exists.
async function wouldRemoveLastSiteAdmin(excludingUserId: string): Promise<boolean> {
  const [remaining] = await db
    .select({ count: sql<number>`count(*)` })
    .from(user)
    .where(and(eq(user.siteAdmin, true), sql`${user.id} != ${excludingUserId}`));
  return Number(remaining?.count ?? 0) === 0;
}

export async function adminRoute(app: FastifyInstance) {
  app.get("/api/admin/groups", { preHandler: requireSiteAdmin }, async () => {
    const entityId = await resolveEntityId();
    const allGroups = await db.select().from(groups).where(eq(groups.entityId, entityId)).orderBy(groups.name);
    const activeMemberships = await db
      .select({ groupId: groupMemberships.groupId })
      .from(groupMemberships)
      .where(eq(groupMemberships.status, "active"));

    const countByGroup = new Map<string, number>();
    for (const m of activeMemberships) countByGroup.set(m.groupId, (countByGroup.get(m.groupId) ?? 0) + 1);

    return allGroups.map((g) => ({ ...g, memberCount: countByGroup.get(g.id) ?? 0 }));
  });

  app.post("/api/admin/groups", { preHandler: requireSiteAdmin }, async (request, reply) => {
    const parsed = CreateGroupBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: "invalid body" });

    const entityId = await resolveEntityId();
    const [existing] = await db
      .select({ id: groups.id })
      .from(groups)
      .where(and(eq(groups.entityId, entityId), eq(groups.name, parsed.data.name)));
    if (existing) return reply.status(409).send({ error: "a group with this name already exists" });

    const [created] = await db.insert(groups).values({ entityId, name: parsed.data.name }).returning();
    return reply.status(201).send({ ...created, memberCount: 0 });
  });

  app.get<{ Params: { groupId: string } }>(
    "/api/admin/groups/:groupId/members",
    { preHandler: requireSiteAdmin },
    async (request, reply) => {
      const { groupId } = request.params;
      const [group] = await db.select({ id: groups.id }).from(groups).where(eq(groups.id, groupId));
      if (!group) return reply.status(404).send({ error: "group not found" });

      const members = await db
        .select({
          id: groupMemberships.id,
          userId: groupMemberships.userId,
          name: user.name,
          email: user.email,
          tier: groupMemberships.tier,
          rules: groupMemberships.rules,
          status: groupMemberships.status,
        })
        .from(groupMemberships)
        .innerJoin(user, eq(groupMemberships.userId, user.id))
        .where(eq(groupMemberships.groupId, groupId));

      const pendingInvitations = await db
        .select({ id: groupInvitations.id, email: groupInvitations.email, tier: groupInvitations.tier, rules: groupInvitations.rules })
        .from(groupInvitations)
        .where(and(eq(groupInvitations.groupId, groupId), isNull(groupInvitations.acceptedAt)));

      return { members, pendingInvitations };
    },
  );

  app.post<{ Params: { groupId: string } }>(
    "/api/admin/groups/:groupId/invitations",
    { preHandler: requireSiteAdmin },
    async (request, reply) => {
      const { groupId } = request.params;
      const parsed = InviteBody.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: "invalid body" });

      const [group] = await db.select().from(groups).where(eq(groups.id, groupId));
      if (!group) return reply.status(404).send({ error: "group not found" });

      const normalizedEmail = parsed.data.email.toLowerCase();
      const tier = parsed.data.tier ?? null;
      const rules = parsed.data.rules ?? [];

      // If this email already has a real account, grant access
      // immediately rather than waiting for a sign-in that isn't needed
      // — mirrors applyPendingGroupInvitations' own reasoning and
      // kerfy's identical behavior (design.md's Decision 5).
      const [existingUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, normalizedEmail));
      if (existingUser) {
        const [existingMembership] = await db
          .select({ id: groupMemberships.id })
          .from(groupMemberships)
          .where(and(eq(groupMemberships.userId, existingUser.id), eq(groupMemberships.groupId, groupId)));
        if (existingMembership) return reply.status(409).send({ error: "this person already has access to this group" });

        const [created] = await db.insert(groupMemberships).values({ userId: existingUser.id, groupId, tier, rules }).returning();
        await sendInviteEmail({ email: normalizedEmail, groupName: group.name });
        return reply.status(201).send({ kind: "membership", ...created });
      }

      const [existingInvitation] = await db
        .select({ id: groupInvitations.id })
        .from(groupInvitations)
        .where(
          and(
            sql`lower(${groupInvitations.email}) = ${normalizedEmail}`,
            eq(groupInvitations.groupId, groupId),
            isNull(groupInvitations.acceptedAt),
          ),
        );
      if (existingInvitation) return reply.status(409).send({ error: "this email already has a pending invitation to this group" });

      const session = await getSession(request);
      const [createdInvitation] = await db
        .insert(groupInvitations)
        .values({ groupId, email: normalizedEmail, tier, rules, invitedByUserId: session!.user.id })
        .returning();
      await sendInviteEmail({ email: normalizedEmail, groupName: group.name });
      return reply.status(201).send({ kind: "invitation", ...createdInvitation });
    },
  );

  // Adds an existing user directly — no email, no invitation. A revoked
  // membership is reactivated (with the supplied rules replacing the old
  // ones) rather than rejected, since the unique (userId, groupId) index
  // means a second row can't exist. See openspec/changes/add-group-member.
  app.post<{ Params: { groupId: string } }>(
    "/api/admin/groups/:groupId/memberships",
    { preHandler: requireSiteAdmin },
    async (request, reply) => {
      const { groupId } = request.params;
      const parsed = AddMemberBody.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: "invalid body" });

      const [group] = await db.select({ id: groups.id }).from(groups).where(eq(groups.id, groupId));
      if (!group) return reply.status(404).send({ error: "group not found" });

      const [target] = await db.select({ id: user.id }).from(user).where(eq(user.id, parsed.data.userId));
      if (!target) return reply.status(404).send({ error: "user not found" });

      const rules = parsed.data.rules ?? [];
      const [existing] = await db
        .select({ id: groupMemberships.id, status: groupMemberships.status })
        .from(groupMemberships)
        .where(and(eq(groupMemberships.userId, target.id), eq(groupMemberships.groupId, groupId)));

      if (existing?.status === "active") {
        return reply.status(409).send({ error: "this person already has access to this group" });
      }

      if (existing) {
        const [reactivated] = await db
          .update(groupMemberships)
          .set({ status: "active", rules, updatedAt: new Date() })
          .where(eq(groupMemberships.id, existing.id))
          .returning();
        return reply.status(201).send(reactivated);
      }

      const [created] = await db.insert(groupMemberships).values({ userId: target.id, groupId, rules }).returning();
      return reply.status(201).send(created);
    },
  );

  app.delete<{ Params: { groupId: string; id: string } }>(
    "/api/admin/groups/:groupId/invitations/:id",
    { preHandler: requireSiteAdmin },
    async (request, reply) => {
      const { groupId, id } = request.params;
      const [deleted] = await db
        .delete(groupInvitations)
        .where(and(eq(groupInvitations.id, id), eq(groupInvitations.groupId, groupId), isNull(groupInvitations.acceptedAt)))
        .returning();
      if (!deleted) return reply.status(404).send({ error: "invitation not found or already accepted" });
      return reply.status(204).send();
    },
  );

  app.patch<{ Params: { groupId: string; id: string } }>(
    "/api/admin/groups/:groupId/memberships/:id",
    { preHandler: requireSiteAdmin },
    async (request, reply) => {
      const { groupId, id } = request.params;
      const parsed = UpdateMembershipBody.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: "invalid body" });

      const [existing] = await db
        .select({ id: groupMemberships.id })
        .from(groupMemberships)
        .where(and(eq(groupMemberships.id, id), eq(groupMemberships.groupId, groupId)));
      if (!existing) return reply.status(404).send({ error: "membership not found" });

      const update: { tier?: string | null; rules?: string[] } = {};
      if (parsed.data.tier !== undefined) update.tier = parsed.data.tier;
      if (parsed.data.rules !== undefined) update.rules = parsed.data.rules;

      const [updated] = await db
        .update(groupMemberships)
        .set({ ...update, updatedAt: new Date() })
        .where(eq(groupMemberships.id, id))
        .returning();
      return updated;
    },
  );

  app.patch<{ Params: { groupId: string; id: string } }>(
    "/api/admin/groups/:groupId/memberships/:id/revoke",
    { preHandler: requireSiteAdmin },
    async (request, reply) => {
      const { groupId, id } = request.params;
      const [existing] = await db
        .select({ id: groupMemberships.id })
        .from(groupMemberships)
        .where(and(eq(groupMemberships.id, id), eq(groupMemberships.groupId, groupId)));
      if (!existing) return reply.status(404).send({ error: "membership not found" });

      const [updated] = await db
        .update(groupMemberships)
        .set({ status: "revoked", updatedAt: new Date() })
        .where(eq(groupMemberships.id, id))
        .returning();
      return updated;
    },
  );

  app.get("/api/admin/users", { preHandler: requireSiteAdmin }, async () => {
    return db
      .select({
        id: user.id,
        name: user.name,
        title: user.title,
        email: user.email,
        siteAdmin: user.siteAdmin,
        siteRules: user.siteRules,
      })
      .from(user)
      .orderBy(user.email);
  });

  // One user plus every membership they hold (revoked included, so the
  // profile can show it as such). See openspec/changes/add-user-profile.
  app.get<{ Params: { id: string } }>("/api/admin/users/:id", { preHandler: requireSiteAdmin }, async (request, reply) => {
    const [found] = await db
      .select({
        id: user.id,
        name: user.name,
        title: user.title,
        email: user.email,
        emailVerified: user.emailVerified,
        siteAdmin: user.siteAdmin,
        siteRules: user.siteRules,
      })
      .from(user)
      .where(eq(user.id, request.params.id));
    if (!found) return reply.status(404).send({ error: "user not found" });

    const memberships = await db
      .select({
        id: groupMemberships.id,
        groupId: groupMemberships.groupId,
        groupName: groups.name,
        status: groupMemberships.status,
        tier: groupMemberships.tier,
        rules: groupMemberships.rules,
      })
      .from(groupMemberships)
      .innerJoin(groups, eq(groupMemberships.groupId, groups.id))
      .where(eq(groupMemberships.userId, found.id))
      .orderBy(groups.name);

    return { ...found, memberships };
  });

  // Creates the account directly — no email, no invitation, no password
  // (sign-in stays magic-link only; the person's first link matches this
  // existing row). Goes through better-auth's internal adapter so the id
  // and timestamps match accounts created by first sign-in. See
  // openspec/changes/add-admin-create-user.
  app.post("/api/admin/users", { preHandler: requireSiteAdmin }, async (request, reply) => {
    const parsed = CreateUserBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: "invalid body" });

    const normalizedEmail = parsed.data.email.toLowerCase();
    const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, normalizedEmail));
    if (existing) return reply.status(409).send({ error: "an account with this email already exists" });

    // Validate the group before creating anything, so a bad group can't
    // leave a user created with no membership.
    const initialGroup = parsed.data.group;
    if (initialGroup) {
      const [group] = await db.select({ id: groups.id }).from(groups).where(eq(groups.id, initialGroup.groupId));
      if (!group) return reply.status(404).send({ error: "group not found" });
    }

    const ctx = await auth.$context;
    const created = await ctx.internalAdapter.createUser(
      { email: normalizedEmail, name: parsed.data.name, emailVerified: false },
      { method: "admin" },
    );

    // title isn't a declared better-auth field, so set it separately.
    const title = parsed.data.title ?? null;
    if (title !== null) await db.update(user).set({ title }).where(eq(user.id, created.id));

    if (initialGroup) {
      await db.insert(groupMemberships).values({
        userId: created.id,
        groupId: initialGroup.groupId,
        tier: initialGroup.tier ?? null,
        rules: initialGroup.rules ?? [],
      });
    }

    return reply.status(201).send({
      id: created.id,
      name: parsed.data.name,
      title,
      email: normalizedEmail,
      siteAdmin: false,
      siteRules: [],
    });
  });

  app.patch<{ Params: { id: string } }>("/api/admin/users/:id", { preHandler: requireSiteAdmin }, async (request, reply) => {
    const parsed = UpdateUserBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: "invalid body" });

    const [existing] = await db.select({ id: user.id, email: user.email }).from(user).where(eq(user.id, request.params.id));
    if (!existing) return reply.status(404).send({ error: "user not found" });

    if (parsed.data.siteAdmin === false) {
      // The bootstrap siteAdmin account keeps siteAdmin permanently,
      // regardless of how many other site admins exist — stronger than
      // wouldRemoveLastSiteAdmin below, which only blocks removing the
      // *last* one. Mirrors the delete route's own protection.
      if (isBootstrapSiteAdminEmail(existing.email)) {
        return reply.status(409).send({ error: "cannot remove siteAdmin from the bootstrap site admin account" });
      }
      if (await wouldRemoveLastSiteAdmin(request.params.id)) {
        return reply.status(409).send({ error: "cannot remove the last siteAdmin" });
      }
    }

    const update: { name?: string; title?: string | null; siteAdmin?: boolean; siteRules?: string[] } = {};
    if (parsed.data.name !== undefined) update.name = parsed.data.name;
    if (parsed.data.title !== undefined) update.title = parsed.data.title;
    if (parsed.data.siteAdmin !== undefined) update.siteAdmin = parsed.data.siteAdmin;
    if (parsed.data.siteRules !== undefined) update.siteRules = parsed.data.siteRules;

    const [updated] = await db
      .update(user)
      .set(update)
      .where(eq(user.id, request.params.id))
      .returning({
        id: user.id,
        name: user.name,
        title: user.title,
        email: user.email,
        siteAdmin: user.siteAdmin,
        siteRules: user.siteRules,
      });
    return updated;
  });

  // No last-siteAdmin check here: the caller is always a siteAdmin
  // (requireSiteAdmin) distinct from the target (self-delete is blocked
  // above), so the caller alone always keeps the post-delete count at
  // least 1 — the guard that matters for deletion is the self-delete
  // check, not a siteAdmin-count check (see design.md's Decision 1).
  app.delete<{ Params: { id: string } }>("/api/admin/users/:id", { preHandler: requireSiteAdmin }, async (request, reply) => {
    const session = await getSession(request);
    if (session!.user.id === request.params.id) {
      return reply.status(409).send({ error: "cannot delete your own account" });
    }

    const [existing] = await db.select({ id: user.id, email: user.email }).from(user).where(eq(user.id, request.params.id));
    if (!existing) return reply.status(404).send({ error: "user not found" });
    // The bootstrap siteAdmin account is never deletable, by anyone —
    // not just self-delete protection. There's exactly one of these,
    // ever (bootstrap-site-admin.ts's own comment); losing it has no
    // recovery path short of a manual DB edit.
    if (isBootstrapSiteAdminEmail(existing.email)) {
      return reply.status(409).send({ error: "cannot delete the bootstrap site admin account" });
    }

    await db.delete(user).where(eq(user.id, request.params.id));
    return reply.status(204).send();
  });

  app.get<{ Params: { userId: string } }>("/api/admin/eod-reports/:userId", { preHandler: requireSiteAdmin }, async (request) => {
    return db
      .select({
        id: eodReports.id,
        reportDate: eodReports.reportDate,
        mode: eodReports.mode,
        tickets: eodReports.tickets,
        devicesRefurbished: eodReports.devicesRefurbished,
        packages: eodReports.packages,
        calls: eodReports.calls,
        other: eodReports.other,
        ticketRows: eodReports.ticketRows,
        deviceRows: eodReports.deviceRows,
        packageRows: eodReports.packageRows,
        contactRows: eodReports.contactRows,
        userEmail: eodReports.userEmail,
      })
      .from(eodReports)
      .where(eq(eodReports.userId, request.params.userId))
      .orderBy(desc(eodReports.reportDate));
  });

  app.get("/api/admin/settings", { preHandler: requireSiteAdmin }, async () => {
    return { eodReportMode: await getEodReportMode() };
  });

  app.patch("/api/admin/settings", { preHandler: requireSiteAdmin }, async (request, reply) => {
    const parsed = UpdateSettingsBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: "invalid body" });

    await setEodReportMode(parsed.data.eodReportMode);
    return { eodReportMode: parsed.data.eodReportMode };
  });
}
