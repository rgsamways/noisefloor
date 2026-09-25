import type { SiteRuleKey } from "@noisefloor/shared";
import type { FastifyReply, FastifyRequest } from "fastify";
import { getSession } from "./get-session.js";

type SiteRuleSubject = { siteAdmin: boolean; siteRules: readonly string[] };

/**
 * A siteAdmin user bypasses every site-wide rule check, regardless of
 * whether they hold that rule in `siteRules` — mirrors kerfy's
 * kerfyAdmin bypass (see openspec/changes/add-entity-group-permissions
 * design.md's Decision 1).
 */
export function hasSiteRule(subject: SiteRuleSubject, rule: SiteRuleKey): boolean {
  return subject.siteAdmin || subject.siteRules.includes(rule);
}

/** The single gate for any route that should be siteAdmin-only. Mirrors kerfy's requireKerfyAdmin. */
export async function requireSiteAdmin(request: FastifyRequest, reply: FastifyReply) {
  const session = await getSession(request);
  if (!session) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  if (!session.user.siteAdmin) {
    return reply.status(403).send({ error: "Forbidden" });
  }
}
