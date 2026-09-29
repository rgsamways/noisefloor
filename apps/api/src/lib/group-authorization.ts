import { ALL_GROUP_RULE_KEYS } from "@noisefloor/shared";
import { and, eq } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../db/client.js";
import { groupMemberships } from "../db/permissions-schema.js";
import { getSession } from "./get-session.js";

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

/**
 * The union of rules across every *active* membership a user holds, for
 * "what can this person do at all" checks that aren't scoped to one
 * specific group (the session rollup, and route gates for features not
 * tied to a single group). A siteAdmin gets every catalog key, matching
 * hasGroupRule's own bypass.
 */
export async function getMyGroupRules(userId: string, isSiteAdmin: boolean): Promise<string[]> {
  if (isSiteAdmin) return [...ALL_GROUP_RULE_KEYS];

  const activeMemberships = await db
    .select({ rules: groupMemberships.rules })
    .from(groupMemberships)
    .where(and(eq(groupMemberships.userId, userId), eq(groupMemberships.status, "active")));

  return [...new Set(activeMemberships.flatMap((m) => m.rules))];
}

/**
 * A Fastify preHandler factory, mirroring requireSiteAdmin's shape, for
 * routes gated by a specific group rule rather than the site-admin flag.
 * siteAdmin always passes (via getMyGroupRules' own bypass).
 */
export function requireGroupRule(rule: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await getSession(request);
    if (!session) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    const rules = await getMyGroupRules(session.user.id, session.user.siteAdmin ?? false);
    if (!rules.includes(rule)) {
      return reply.status(403).send({ error: "Forbidden" });
    }
  };
}
