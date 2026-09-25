import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { groupMemberships } from "../db/permissions-schema.js";

/**
 * A siteAdmin identity is exempt — it is never itself subject to a
 * group's own membership rules, mirroring kerfy's
 * canManageMembershipsForCompany. Otherwise, the acting user must hold
 * `rule` via an *active* membership in that exact group; a revoked
 * membership never passes even if its `rules` still lists the rule
 * (design.md's Decision — status preserves history but excludes revoked
 * rows from access checks).
 */
export async function hasGroupRule(userId: string, groupId: string, rule: string, isSiteAdmin: boolean): Promise<boolean> {
  if (isSiteAdmin) return true;

  const activeMemberships = await db
    .select({ rules: groupMemberships.rules })
    .from(groupMemberships)
    .where(and(eq(groupMemberships.userId, userId), eq(groupMemberships.groupId, groupId), eq(groupMemberships.status, "active")));

  return activeMemberships.some((m) => m.rules.includes(rule));
}
