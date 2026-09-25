import type { FastifyInstance } from "fastify";
import { requireSession } from "../lib/get-session.js";

// The one route the client calls to get an *authoritative* siteAdmin
// value — unlike Better Auth's own /api/auth/get-session (what
// authClient.useSession() reads), this goes through our getSession
// wrapper, which is the only place applyPendingGroupInvitations and
// applyBootstrapSiteAdmin actually run. A client relying solely on
// Better Auth's cached session would see a stale siteAdmin: false on
// the very request that should have just flipped it true. See
// RequireSiteAdmin.tsx.
export async function sessionRoute(app: FastifyInstance) {
  app.get("/api/session", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    return { siteAdmin: session.user.siteAdmin, siteRules: session.user.siteRules };
  });
}
