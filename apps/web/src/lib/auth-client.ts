import { magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: apiUrl,
  fetchOptions: { credentials: "include" },
  plugins: [magicLinkClient()],
});
