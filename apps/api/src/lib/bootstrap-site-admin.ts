import { eq } from "drizzle-orm";
import { user } from "../db/auth-schema.js";
import { db } from "../db/client.js";

// The one account bootstrapped as siteAdmin — see
// openspec/changes/add-entity-group-permissions design.md's Decision 7.
// Not an env var: there is exactly one bootstrap account, ever: once an
// admin UI exists, granting siteAdmin to anyone else goes through that,
// not a second hardcoded address. Exported (rather than kept private)
// solely so tests can substitute a throwaway address instead of the real
// one — get-session.ts's real call site never overrides the default.
export const BOOTSTRAP_SITE_ADMIN_EMAIL = "rgsamways@gmail.com";

/**
 * Idempotent and self-healing: called on every session resolution
 * (get-session.ts), so it applies correctly whether the bootstrap
 * account existed before this capability was deployed or gets created
 * afterward. A no-op for every other email, and a no-op once `siteAdmin`
 * is already true. Returns whether it just flipped the flag, so the
 * caller can patch its already-fetched session object rather than
 * returning a stale `siteAdmin: false` on this same request.
 */
export async function applyBootstrapSiteAdmin(
  userId: string,
  email: string,
  bootstrapEmail: string = BOOTSTRAP_SITE_ADMIN_EMAIL,
): Promise<boolean> {
  if (email.toLowerCase() !== bootstrapEmail.toLowerCase()) return false;

  const [row] = await db.select({ siteAdmin: user.siteAdmin }).from(user).where(eq(user.id, userId));
  if (row?.siteAdmin) return false;

  await db.update(user).set({ siteAdmin: true }).where(eq(user.id, userId));
  return true;
}
