import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { user } from "../db/auth-schema.js";
import { db } from "../db/client.js";
import { createTestSession } from "../test-utils/auth.js";
import { hasSiteRule, requireSiteAdmin } from "./site-admin.js";

describe("hasSiteRule", () => {
  it("bypasses for a siteAdmin subject regardless of siteRules", () => {
    expect(hasSiteRule({ siteAdmin: true, siteRules: [] }, "manage_users")).toBe(true);
  });

  it("allows a non-admin subject that holds the rule", () => {
    expect(hasSiteRule({ siteAdmin: false, siteRules: ["manage_users"] }, "manage_users")).toBe(true);
  });

  it("denies a non-admin subject that doesn't hold the rule", () => {
    expect(hasSiteRule({ siteAdmin: false, siteRules: [] }, "manage_users")).toBe(false);
  });
});

describe("requireSiteAdmin", () => {
  it("401s an unauthenticated request", async () => {
    const app = buildApp();
    app.get("/__test_only_site_admin", { preHandler: requireSiteAdmin }, async () => ({ ok: true }));

    const response = await app.inject({ method: "GET", url: "/__test_only_site_admin" });
    expect(response.statusCode).toBe(401);
  });

  it("403s a signed-in, non-siteAdmin request", async () => {
    const app = buildApp();
    app.get("/__test_only_site_admin", { preHandler: requireSiteAdmin }, async () => ({ ok: true }));
    const { cookie, cleanup } = await createTestSession(app);
    try {
      const response = await app.inject({ method: "GET", url: "/__test_only_site_admin", headers: { cookie } });
      expect(response.statusCode).toBe(403);
    } finally {
      await cleanup();
    }
  });

  it("passes a signed-in siteAdmin request", async () => {
    const app = buildApp();
    app.get("/__test_only_site_admin", { preHandler: requireSiteAdmin }, async () => ({ ok: true }));
    const { cookie, email, cleanup } = await createTestSession(app);
    try {
      await db.update(user).set({ siteAdmin: true }).where(eq(user.email, email));
      const response = await app.inject({ method: "GET", url: "/__test_only_site_admin", headers: { cookie } });
      expect(response.statusCode).toBe(200);
    } finally {
      await cleanup();
    }
  });
});
