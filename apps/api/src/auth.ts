import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins/magic-link";
import { db } from "./db/client.js";
import * as authSchema from "./db/auth-schema.js";
import { env } from "./env.js";
import { sendMagicLink } from "./lib/send-magic-link.js";

// Whenever the API is actually served from a noisefloor.ca subdomain (e.g.
// api.noisefloor.ca), the session cookie can be scoped to the shared parent
// domain so the web app subdomain sees it as same-site — immune to browsers
// blocking third-party cookies. On a temporary *.up.railway.app domain
// there's no shared parent with the web app, so this stays off and the
// `sameSite: "none"` fallback below does the work instead (weaker: relies on
// third-party cookies being allowed at all). Mirrors kerfy's auth.ts, which
// hit this exact failure mode once — see PROJECT-PLAN.md risk R5.
const authUrlHost = new URL(env.BETTER_AUTH_URL).hostname;
const noisefloorParentDomain = "noisefloor.ca";
const isNoisefloorSubdomain = authUrlHost.endsWith(`.${noisefloorParentDomain}`);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.WEB_URL],
  advanced: {
    // sameSite: "none" is the fallback for temporary cross-site domains
    // (harmless once crossSubDomainCookies applies too, since same-site
    // requests are unaffected by SameSite=None). secure: true is required
    // alongside SameSite=None (a browser silently refuses to store the
    // cookie at all otherwise) — Chrome treats `localhost` as a secure
    // context, so this still works over plain http locally.
    defaultCookieAttributes: { sameSite: "none", secure: true },
    ...(isNoisefloorSubdomain ? { crossSubDomainCookies: { enabled: true, domain: noisefloorParentDomain } } : {}),
  },
  plugins: [magicLink({ sendMagicLink, expiresIn: 1800 })],
});
