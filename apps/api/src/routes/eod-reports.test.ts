import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { db } from "../db/client.js";
import { eodReports } from "../db/schema.js";
import { createTestSession } from "../test-utils/auth.js";

const REPORT = { tickets: "t1", devicesRefurbished: "d1", packages: "p1", calls: "c1", other: "o1" };

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
