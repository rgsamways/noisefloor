import { Navigate, Outlet } from "react-router";
import { authClient } from "../lib/auth-client";

export function RequireAuth() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;
  if (!session) return <Navigate to="/sign-in" replace />;

  return <Outlet />;
}
