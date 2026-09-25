import { useEffect } from "react";
import { apiFetch } from "../lib/api";
import { authClient } from "../lib/auth-client";

// Renders nothing — its only job is to call GET /api/session shortly
// after ANY signed-in visit to ANY page, not just admin-gated ones.
// authClient.useSession() (used below, and by RequireAuth) reads Better
// Auth's own /api/auth/get-session endpoint directly, which never passes
// through our own getSession wrapper (apps/api/src/lib/get-session.ts) —
// the only place applyPendingGroupInvitations/applyBootstrapSiteAdmin
// actually run. Without this, a freshly invited or bootstrapped user
// whose browser only ever visits public/non-admin pages would never
// trigger either hook, no matter how many times anyone refreshes a page
// that does read live server state (e.g. the admin panel) — there'd
// genuinely be nothing there yet to show. Fire-and-forget: a failure
// here shouldn't block anything the user is doing.
export function SessionSync() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;
    apiFetch("/api/session").catch(() => {});
  }, [userId]);

  return null;
}
