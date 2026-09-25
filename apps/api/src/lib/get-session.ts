import type { FastifyReply, FastifyRequest } from "fastify";
import { auth } from "../auth.js";
import { applyBootstrapSiteAdmin } from "./bootstrap-site-admin.js";
import { applyPendingGroupInvitations } from "./group-invitations.js";

// Mirrors routes/auth.ts's header conversion — Better Auth's server API
// wants a standard Headers object, not Fastify's raw header shape.
export async function getSession(request: FastifyRequest) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value) headers.append(key, Array.isArray(value) ? value.join(", ") : value);
  }
  const session = await auth.api.getSession({ headers });
  // Applied on every session resolution, not just sign-in — both are
  // self-limiting no-ops once already applied, so the repeated calls
  // cost an indexed lookup, not a real side effect, on every request
  // after the first. See openspec/changes/add-entity-group-permissions
  // design.md's Decisions 6-7.
  if (session) {
    await applyPendingGroupInvitations(session.user.id, session.user.email);
    // Patch the in-memory session if this request just flipped the flag —
    // otherwise this same request would still see the pre-update
    // `siteAdmin: false` it already fetched, only self-healing on the
    // *next* request instead of this one.
    const justBecameSiteAdmin = await applyBootstrapSiteAdmin(session.user.id, session.user.email);
    if (justBecameSiteAdmin) session.user.siteAdmin = true;
  }
  return session;
}

// No public/anonymous case-player routes in this slice (design.md
// non-goals) — every case/attempt route needs a session, so this shared
// guard 401s and returns undefined rather than each route repeating it.
export async function requireSession(request: FastifyRequest, reply: FastifyReply) {
  const session = await getSession(request);
  if (!session) {
    reply.status(401).send({ error: "unauthorized" });
    return undefined;
  }
  return session;
}
