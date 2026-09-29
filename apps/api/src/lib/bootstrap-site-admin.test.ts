import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { user } from "../db/auth-schema.js";
import { db } from "../db/client.js";
import { createTestSession } from "../test-utils/auth.js";
import { applyBootstrapSiteAdmin, isBootstrapSiteAdminEmail } from "./bootstrap-site-admin.js";

describe("isBootstrapSiteAdminEmail", () => {
  it("matches the given bootstrap email", () => {
    expect(isBootstrapSiteAdminEmail("someone@example.com", "someone@example.com")).toBe(true);
  });

  it("matches case-insensitively", () => {
    expect(isBootstrapSiteAdminEmail("Someone@Example.com", "someone@example.com")).toBe(true);
  });

  it("does not match a different email", () => {
    expect(isBootstrapSiteAdminEmail("someone@example.com", "someone-else@example.com")).toBe(false);
  });
});

describe("applyBootstrapSiteAdmin", () => {
  it("sets siteAdmin true for a fresh account matching the bootstrap email", async () => {
    const app = buildApp();
    const { email, cleanup } = await createTestSession(app);
    try {
      const [testUser] = await db.select({ id: user.id, siteAdmin: user.siteAdmin }).from(user).where(eq(user.email, email));
      expect(testUser!.siteAdmin).toBe(false);

      const changed = await applyBootstrapSiteAdmin(testUser!.id, email, email);
      expect(changed).toBe(true);

      const [reloaded] = await db.select({ siteAdmin: user.siteAdmin }).from(user).where(eq(user.id, testUser!.id));
      expect(reloaded?.siteAdmin).toBe(true);
    } finally {
      await cleanup();
    }
  });

  it("is idempotent for an account that already has siteAdmin true", async () => {
    const app = buildApp();
    const { email, cleanup } = await createTestSession(app);
    try {
      const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
      await db.update(user).set({ siteAdmin: true }).where(eq(user.id, testUser!.id));

      const changed = await applyBootstrapSiteAdmin(testUser!.id, email, email);
      expect(changed).toBe(false);

      const [reloaded] = await db.select({ siteAdmin: user.siteAdmin }).from(user).where(eq(user.id, testUser!.id));
      expect(reloaded?.siteAdmin).toBe(true);
    } finally {
      await cleanup();
    }
  });

  it("leaves a non-matching email untouched", async () => {
    const app = buildApp();
    const { email, cleanup } = await createTestSession(app);
    try {
      const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));

      const changed = await applyBootstrapSiteAdmin(testUser!.id, email, "someone-else@example.com");
      expect(changed).toBe(false);

      const [reloaded] = await db.select({ siteAdmin: user.siteAdmin }).from(user).where(eq(user.id, testUser!.id));
      expect(reloaded?.siteAdmin).toBe(false);
    } finally {
      await cleanup();
    }
  });
});
