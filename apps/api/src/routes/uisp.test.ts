import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../env.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../env.js")>();
  return {
    ...actual,
    env: { ...actual.env, UISP_BASE_URL: "https://uisp.example.test", UISP_API_TOKEN: "test-token" },
  };
});

import { buildApp } from "../app.js";
import { user } from "../db/auth-schema.js";
import { db } from "../db/client.js";
import { entities, groupMemberships, groups } from "../db/permissions-schema.js";
import { createTestSession } from "../test-utils/auth.js";

async function makeSiteAdmin(app: ReturnType<typeof buildApp>) {
  const { cookie, email, cleanup } = await createTestSession(app);
  const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  await db.update(user).set({ siteAdmin: true }).where(eq(user.id, testUser!.id));
  return { cookie, cleanup };
}

// Reuses the existing seeded entity — see genieacs.test.ts's
// makeDeviceStatusHolder for why.
async function makeDeviceStatusHolder(app: ReturnType<typeof buildApp>) {
  const { cookie, email, cleanup } = await createTestSession(app);
  const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  const [entity] = await db.select({ id: entities.id }).from(entities).limit(1);
  const [group] = await db.insert(groups).values({ entityId: entity!.id, name: `Test Group ${crypto.randomUUID()}` }).returning();
  await db.insert(groupMemberships).values({ userId: testUser!.id, groupId: group!.id, rules: ["view_device_status"] });
  return {
    cookie,
    cleanup: async () => {
      await db.delete(groups).where(eq(groups.id, group!.id));
      await cleanup();
    },
  };
}

function mockUispFetch(response: { ok: boolean; status: number; json: () => Promise<unknown> }) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
}

describe("GET /api/uisp/devices/:deviceId", () => {
  const cleanups: Array<() => Promise<void>> = [];

  afterEach(async () => {
    vi.unstubAllGlobals();
    for (const cleanup of cleanups.splice(0)) await cleanup();
  });

  const FULL_DEVICE = {
    identification: { id: "radio-1", name: "NanoBeam AC", model: "NBE-5AC-19" },
    overview: { status: "active", frequency: 5745, channelWidth: 40, signal: -58, uptime: 123456, cpu: 12, ram: 34 },
  };

  it("returns the device detail with an online status for a holder", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await makeDeviceStatusHolder(app);
    cleanups.push(cleanup);
    mockUispFetch({ ok: true, status: 200, json: async () => FULL_DEVICE });

    const response = await app.inject({ method: "GET", url: "/api/uisp/devices/radio-1", headers: { cookie } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: "radio-1", name: "NanoBeam AC", status: "active" });
  });

  it("returns 404 when UISP has no matching device", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await makeDeviceStatusHolder(app);
    cleanups.push(cleanup);
    mockUispFetch({ ok: false, status: 404, json: async () => ({}) });

    const response = await app.inject({ method: "GET", url: "/api/uisp/devices/unknown-radio", headers: { cookie } });
    expect(response.statusCode).toBe(404);
  });

  it("returns 502 when UISP is unreachable", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await makeDeviceStatusHolder(app);
    cleanups.push(cleanup);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED")));

    const response = await app.inject({ method: "GET", url: "/api/uisp/devices/radio-1", headers: { cookie } });
    expect(response.statusCode).toBe(502);
  });

  it("rejects an unauthenticated request with 401", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/uisp/devices/radio-1" });
    expect(response.statusCode).toBe(401);
  });

  it("rejects an authenticated caller without view_device_status with 403", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await createTestSession(app);
    cleanups.push(cleanup);

    const response = await app.inject({ method: "GET", url: "/api/uisp/devices/radio-1", headers: { cookie } });
    expect(response.statusCode).toBe(403);
  });

  it("lets a siteAdmin through without holding view_device_status", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await makeSiteAdmin(app);
    cleanups.push(cleanup);
    mockUispFetch({ ok: true, status: 200, json: async () => FULL_DEVICE });

    const response = await app.inject({ method: "GET", url: "/api/uisp/devices/radio-1", headers: { cookie } });
    expect(response.statusCode).toBe(200);
  });
});
