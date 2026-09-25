import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { user } from "../db/auth-schema.js";
import { db } from "../db/client.js";
import { entities, groupInvitations, groupMemberships, groups } from "../db/permissions-schema.js";
import { eodReports } from "../db/schema.js";
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
  rules: z.array(z.string()).optional(),
});
const UpdateMembershipBody = z.object({
  tier: z.string().nullable().optional(),
  rules: z.array(z.string()).optional(),
});
const UpdateSettingsBody = z.object({ eodReportMode: z.enum(["freeform", "structured"]) });
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

  app.patch<{ Params: { id: string } }>("/api/admin/users/:id", { preHandler: requireSiteAdmin }, async (request, reply) => {
    const parsed = UpdateUserBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: "invalid body" });

    const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.id, request.params.id));
    if (!existing) return reply.status(404).send({ error: "user not found" });

    if (parsed.data.siteAdmin === false && (await wouldRemoveLastSiteAdmin(request.params.id))) {
      return reply.status(409).send({ error: "cannot remove the last siteAdmin" });
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

    const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.id, request.params.id));
    if (!existing) return reply.status(404).send({ error: "user not found" });

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
