import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import { apiFetch } from "../lib/api";

// Deliberately does NOT trust authClient.useSession()'s cached siteAdmin
// value: that reads Better Auth's own /api/auth/get-session endpoint
// directly, which never passes through our getSession wrapper — the
// only place applyPendingGroupInvitations/applyBootstrapSiteAdmin
// actually run (apps/api/src/lib/get-session.ts). A user whose siteAdmin
// flag should just have flipped true would still see a stale false from
// the client cache. Calling GET /api/session instead forces that
// resolution to happen before this gate decides. Redirects to "/" rather
// than "/sign-in" — unlike an anonymous visitor, a signed-in non-admin
// has nowhere admin-related to go.
export function RequireSiteAdmin() {
  const [siteAdmin, setSiteAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    apiFetch<{ siteAdmin: boolean }>("/api/session").then(
      (data) => setSiteAdmin(data.siteAdmin),
      () => setSiteAdmin(false),
    );
  }, []);

  if (siteAdmin === null) return null;
  if (!siteAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
