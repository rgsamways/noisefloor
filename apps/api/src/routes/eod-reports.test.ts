import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { user } from "../db/auth-schema.js";
import { db } from "../db/client.js";
import { entities } from "../db/permissions-schema.js";
import { eodReports } from "../db/schema.js";
import { createTestSession } from "../test-utils/auth.js";

async function makeSiteAdmin(app: ReturnType<typeof buildApp>) {
  const { cookie, email, cleanup } = await createTestSession(app);
  const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  await db.update(user).set({ siteAdmin: true }).where(eq(user.id, testUser!.id));
  return { cookie, email, userId: testUser!.id, cleanup };
}

const REPORT = { tickets: "t1", devicesRefurbished: "d1", packages: "p1", calls: "c1", other: "o1" };
const STRUCTURED_REPORT = {
  ticketRows: [{ ticketNumber: "T-1", customer: "Jane", summary: "radio swap", status: "Resolved" }],
  deviceRows: [{ deviceType: "ATA", serialId: "SN123", notes: "reflashed" }],
  packageRows: [{ direction: "accepted" as const, description: "returned radio", tracking: "1Z999" }],
  contactRows: [{ customer: "Jane", method: "phone" as const, contact: "555-1234", reason: "outage", outcome: "resolved" }],
  other: "o1",
};

// Every test that flips the site-wide mode must restore it afterward —
// this row is shared across every test file hitting the same local dev
// database, not isolated per test.
async function withEodReportMode(mode: "freeform" | "structured", cleanups: Array<() => Promise<void>>) {
  const [entity] = await db.select({ id: entities.id, eodReportMode: entities.eodReportMode }).from(entities).limit(1);
  await db.update(entities).set({ eodReportMode: mode }).where(eq(entities.id, entity!.id));
  cleanups.push(async () => {
    await db.update(entities).set({ eodReportMode: entity!.eodReportMode }).where(eq(entities.id, entity!.id));
  });
}

describe("eod-reports routes", () => {
  const cleanups: Array<() => Promise<void>> = [];

  afterEach(async () => {
    for (const cleanup of cleanups.splice(0)) await cleanup();
  });

  describe("PUT /api/eod-reports/:date", () => {
    it("creates a report for a new date", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await createTestSession(app);
      cleanups.push(cleanup);

      const response = await app.inject({ method: "PUT", url: "/api/eod-reports/2026-09-25", headers: { cookie }, payload: REPORT });
      expect(response.statusCode).toBe(200);
      const body = response.json() as { reportDate: string; tickets: string };
      expect(body.reportDate).toBe("2026-09-25");
      expect(body.tickets).toBe("t1");
    });

    it("replaces an already-filed date's content instead of creating a second row", async () => {
      const app = buildApp();
      const { cookie, email, cleanup } = await createTestSession(app);
      cleanups.push(cleanup);

      await app.inject({ method: "PUT", url: "/api/eod-reports/2026-09-25", headers: { cookie }, payload: REPORT });
      const response = await app.inject({
        method: "PUT",
        url: "/api/eod-reports/2026-09-25",
        headers: { cookie },
        payload: { ...REPORT, tickets: "updated" },
      });
      expect(response.statusCode).toBe(200);
      const body = response.json() as { tickets: string };
      expect(body.tickets).toBe("updated");

      const rows = await db.select().from(eodReports).where(eq(eodReports.userEmail, email));
      expect(rows).toHaveLength(1);
      expect(rows[0]?.tickets).toBe("updated");
    });

    it("snapshots the caller's email at write time", async () => {
      const app = buildApp();
      const { cookie, email, cleanup } = await createTestSession(app);
      cleanups.push(cleanup);

      await app.inject({ method: "PUT", url: "/api/eod-reports/2026-09-25", headers: { cookie }, payload: REPORT });
      const [row] = await db.select().from(eodReports).where(eq(eodReports.userEmail, email));
      expect(row?.userEmail).toBe(email);
    });
  });

  describe("GET /api/eod-report-mode", () => {
    it("defaults to freeform", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await createTestSession(app);
      cleanups.push(cleanup);

      const response = await app.inject({ method: "GET", url: "/api/eod-report-mode", headers: { cookie } });
      expect(response.statusCode).toBe(200);
      expect((response.json() as { mode: string }).mode).toBe("freeform");
    });

    it("rejects an unauthenticated request", async () => {
      const app = buildApp();
      const response = await app.inject({ method: "GET", url: "/api/eod-report-mode" });
      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET/PATCH /api/admin/settings", () => {
    it("lets a siteAdmin read and update the eod report mode", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);
      const [entity] = await db.select({ id: entities.id, eodReportMode: entities.eodReportMode }).from(entities).limit(1);
      cleanups.push(async () => {
        await db.update(entities).set({ eodReportMode: entity!.eodReportMode }).where(eq(entities.id, entity!.id));
      });

      const getResponse = await app.inject({ method: "GET", url: "/api/admin/settings", headers: { cookie } });
      expect(getResponse.statusCode).toBe(200);
      expect((getResponse.json() as { eodReportMode: string }).eodReportMode).toBe("freeform");

      const patchResponse = await app.inject({
        method: "PATCH",
        url: "/api/admin/settings",
        headers: { cookie },
        payload: { eodReportMode: "structured" },
      });
      expect(patchResponse.statusCode).toBe(200);
      expect((patchResponse.json() as { eodReportMode: string }).eodReportMode).toBe("structured");

      const [reloaded] = await db.select({ eodReportMode: entities.eodReportMode }).from(entities).limit(1);
      expect(reloaded?.eodReportMode).toBe("structured");
    });

    it("rejects a non-siteAdmin caller", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await createTestSession(app);
      cleanups.push(cleanup);

      const getResponse = await app.inject({ method: "GET", url: "/api/admin/settings", headers: { cookie } });
      const patchResponse = await app.inject({
        method: "PATCH",
        url: "/api/admin/settings",
        headers: { cookie },
        payload: { eodReportMode: "structured" },
      });
      expect(getResponse.statusCode).toBe(403);
      expect(patchResponse.statusCode).toBe(403);
    });
  });

  describe("structured mode", () => {
    it("saves a structured report when the site's mode is structured", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await createTestSession(app);
      cleanups.push(cleanup);
      await withEodReportMode("structured", cleanups);

      const response = await app.inject({
        method: "PUT",
        url: "/api/eod-reports/2026-09-25",
        headers: { cookie },
        payload: STRUCTURED_REPORT,
      });
      expect(response.statusCode).toBe(200);
      const body = response.json() as { mode: string; ticketRows: Array<{ ticketNumber: string }> };
      expect(body.mode).toBe("structured");
      expect(body.ticketRows[0]?.ticketNumber).toBe("T-1");
    });

    it("keeps an already-filed freeform report freeform even after the site switches to structured", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await createTestSession(app);
      cleanups.push(cleanup);

      await app.inject({ method: "PUT", url: "/api/eod-reports/2026-09-25", headers: { cookie }, payload: REPORT });
      await withEodReportMode("structured", cleanups);

      const response = await app.inject({
        method: "PUT",
        url: "/api/eod-reports/2026-09-25",
        headers: { cookie },
        payload: { ...REPORT, tickets: "still freeform" },
      });
      expect(response.statusCode).toBe(200);
      const body = response.json() as { mode: string; tickets: string };
      expect(body.mode).toBe("freeform");
      expect(body.tickets).toBe("still freeform");
    });

    it("rejects a structured body for a freeform-mode save", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await createTestSession(app);
      cleanups.push(cleanup);

      const response = await app.inject({
        method: "PUT",
        url: "/api/eod-reports/2026-09-25",
        headers: { cookie },
        payload: STRUCTURED_REPORT,
      });
      expect(response.statusCode).toBe(400);
    });

    it("rejects a freeform body for a structured-mode save", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await createTestSession(app);
      cleanups.push(cleanup);
      await withEodReportMode("structured", cleanups);

      const response = await app.inject({
        method: "PUT",
        url: "/api/eod-reports/2026-09-25",
        headers: { cookie },
        payload: REPORT,
      });
      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /api/eod-reports/:date", () => {
    it("returns 404 for a date with no filed report", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await createTestSession(app);
      cleanups.push(cleanup);

      const response = await app.inject({ method: "GET", url: "/api/eod-reports/2026-01-01", headers: { cookie } });
      expect(response.statusCode).toBe(404);
    });

    it("returns the filed report for a date", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await createTestSession(app);
      cleanups.push(cleanup);

      await app.inject({ method: "PUT", url: "/api/eod-reports/2026-09-25", headers: { cookie }, payload: REPORT });
      const response = await app.inject({ method: "GET", url: "/api/eod-reports/2026-09-25", headers: { cookie } });
      expect(response.statusCode).toBe(200);
      expect((response.json() as { tickets: string }).tickets).toBe("t1");
    });
  });

  describe("GET /api/eod-reports", () => {
    it("only returns the caller's own reports", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await createTestSession(app);
      cleanups.push(cleanup);
      const { cookie: otherCookie, cleanup: otherCleanup } = await createTestSession(app);
      cleanups.push(otherCleanup);

      await app.inject({ method: "PUT", url: "/api/eod-reports/2026-09-25", headers: { cookie }, payload: REPORT });
      await app.inject({ method: "PUT", url: "/api/eod-reports/2026-09-24", headers: { cookie: otherCookie }, payload: REPORT });

      const response = await app.inject({ method: "GET", url: "/api/eod-reports", headers: { cookie } });
      expect(response.statusCode).toBe(200);
      const body = response.json() as Array<{ reportDate: string }>;
      expect(body).toHaveLength(1);
      expect(body[0]?.reportDate).toBe("2026-09-25");
    });
  });

  describe("unauthenticated access", () => {
    it("rejects list/get/put without a session", async () => {
      const app = buildApp();
      const list = await app.inject({ method: "GET", url: "/api/eod-reports" });
      const get = await app.inject({ method: "GET", url: "/api/eod-reports/2026-09-25" });
      const put = await app.inject({ method: "PUT", url: "/api/eod-reports/2026-09-25", payload: REPORT });
      expect(list.statusCode).toBe(401);
      expect(get.statusCode).toBe(401);
      expect(put.statusCode).toBe(401);
    });
  });
});
