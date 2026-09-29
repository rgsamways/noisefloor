import type { FastifyInstance } from "fastify";
import { getMyGroupRules } from "../lib/group-authorization.js";
import { requireSession } from "../lib/get-session.js";

// The one route the client calls to get an *authoritative* siteAdmin
// value — unlike Better Auth's own /api/auth/get-session (what
// authClient.useSession() reads), this goes through our getSession
// wrapper, which is the only place applyPendingGroupInvitations and
// applyBootstrapSiteAdmin actually run. A client relying solely on
// Better Auth's cached session would see a stale siteAdmin: false on
// the very request that should have just flipped it true. See
// RequireSiteAdmin.tsx. groupRules (added for the post-sign-in hub) is
// the union of rules across every active group membership — the same
// authoritative-freshness reasoning applies to it as to siteAdmin.
export async function sessionRoute(app: FastifyInstance) {
  app.get("/api/session", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const groupRules = await getMyGroupRules(session.user.id, session.user.siteAdmin ?? false);
    return { siteAdmin: session.user.siteAdmin, siteRules: session.user.siteRules, groupRules };
  });
}
