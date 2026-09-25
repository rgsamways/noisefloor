import { inferAdditionalFields, magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: apiUrl,
  fetchOptions: { credentials: "include" },
  plugins: [
    magicLinkClient(),
    // Mirrors apps/api/src/auth.ts's user.additionalFields independently
    // (not a cross-package type import) — apps/web and apps/api are
    // separately deployed services, so this is intentional duplication,
    // same reasoning as this project's other deliberately-duplicated
    // schemas (see e.g. packages/kb/scripts/generate-articles.mjs).
    inferAdditionalFields({
      user: {
        siteAdmin: { type: "boolean" },
        siteRules: { type: "string[]" },
      },
    }),
  ],
});
