import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { groupInvitations, groupMemberships } from "../db/permissions-schema.js";

/**
 * Converts any pending (unaccepted) invitations matching this email into
 * real group memberships, and marks them accepted. Called on every session
 * resolution (get-session.ts) — self-limiting after the first successful
 * run, since an accepted invitation no longer matches the
 * `isNull(acceptedAt)` filter. Email matching is case-insensitive: both
 * sides are compared lowercased, since invitations are stored lowercased
 * at write time but this guards against any future write path that isn't.
 * Adapted from kerfy's apps/api/src/lib/company-invitations.ts.
 */
export async function applyPendingGroupInvitations(userId: string, email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase();
  const pending = await db
    .select()
    .from(groupInvitations)
    .where(and(sql`lower(${groupInvitations.email}) = ${normalizedEmail}`, isNull(groupInvitations.acceptedAt)));

  for (const invitation of pending) {
    // A membership may already exist (e.g. the same email was invited
    // twice, or already joined some other way) — the unique index on
    // (userId, groupId) would reject a duplicate insert, so check first
    // rather than relying on a thrown constraint error as control flow.
    const [existing] = await db
      .select({ id: groupMemberships.id })
      .from(groupMemberships)
      .where(and(eq(groupMemberships.userId, userId), eq(groupMemberships.groupId, invitation.groupId)));

    if (!existing) {
      await db.insert(groupMemberships).values({
        userId,
        groupId: invitation.groupId,
        tier: invitation.tier,
        rules: invitation.rules,
      });
    }

    await db.update(groupInvitations).set({ acceptedAt: new Date() }).where(eq(groupInvitations.id, invitation.id));
  }
}
