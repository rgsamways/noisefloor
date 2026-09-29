import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
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

// Reuses the existing seeded entity — see eod-reports.test.ts's
// makeEodReportUser for why.
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

function mockGenieAcsFetch(devices: unknown[]) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => devices }));
}

describe("GET /api/genieacs/devices/:deviceId/status", () => {
  const cleanups: Array<() => Promise<void>> = [];

  afterEach(async () => {
    vi.unstubAllGlobals();
    for (const cleanup of cleanups.splice(0)) await cleanup();
  });

  it("returns online for a device that recently checked in", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await makeDeviceStatusHolder(app);
    cleanups.push(cleanup);
    mockGenieAcsFetch([
      {
        _id: "bench-device",
        _lastInform: new Date().toISOString(),
        Device: { ManagementServer: { PeriodicInformInterval: { _value: 300 } } },
      },
    ]);

    const response = await app.inject({ method: "GET", url: "/api/genieacs/devices/bench-device/status", headers: { cookie } });
    expect(response.statusCode).toBe(200);
    expect((response.json() as { status: string }).status).toBe("online");
  });

  it("returns offline for a device that missed its check-in window", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await makeDeviceStatusHolder(app);
    cleanups.push(cleanup);
    mockGenieAcsFetch([
      {
        _id: "bench-device",
        _lastInform: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        Device: { ManagementServer: { PeriodicInformInterval: { _value: 300 } } },
      },
    ]);

    const response = await app.inject({ method: "GET", url: "/api/genieacs/devices/bench-device/status", headers: { cookie } });
    expect(response.statusCode).toBe(200);
    expect((response.json() as { status: string }).status).toBe("offline");
  });

  it("returns 404 when GenieACS has no matching device", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await makeDeviceStatusHolder(app);
    cleanups.push(cleanup);
    mockGenieAcsFetch([]);

    const response = await app.inject({ method: "GET", url: "/api/genieacs/devices/unknown-device/status", headers: { cookie } });
    expect(response.statusCode).toBe(404);
  });

  it("returns 502 when GenieACS is unreachable", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await makeDeviceStatusHolder(app);
    cleanups.push(cleanup);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED")));

    const response = await app.inject({ method: "GET", url: "/api/genieacs/devices/bench-device/status", headers: { cookie } });
    expect(response.statusCode).toBe(502);
  });

  it("rejects an unauthenticated request with 401", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/genieacs/devices/bench-device/status" });
    expect(response.statusCode).toBe(401);
  });

  it("rejects an authenticated caller without view_device_status with 403", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await createTestSession(app);
    cleanups.push(cleanup);

    const response = await app.inject({ method: "GET", url: "/api/genieacs/devices/bench-device/status", headers: { cookie } });
    expect(response.statusCode).toBe(403);
  });

  it("lets a siteAdmin through without holding view_device_status", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await makeSiteAdmin(app);
    cleanups.push(cleanup);
    mockGenieAcsFetch([
      {
        _id: "bench-device",
        _lastInform: new Date().toISOString(),
        Device: { ManagementServer: { PeriodicInformInterval: { _value: 300 } } },
      },
    ]);

    const response = await app.inject({ method: "GET", url: "/api/genieacs/devices/bench-device/status", headers: { cookie } });
    expect(response.statusCode).toBe(200);
  });
});

describe("GET /api/genieacs/devices/:deviceId", () => {
  const cleanups: Array<() => Promise<void>> = [];

  afterEach(async () => {
    vi.unstubAllGlobals();
    for (const cleanup of cleanups.splice(0)) await cleanup();
  });

  const FULL_DEVICE = {
    _id: "bench-device",
    _deviceId: { _Manufacturer: "MikroTik", _OUI: "E48D8C", _ProductClass: "hAP lite", _SerialNumber: "8CE6085532C7" },
    _lastInform: new Date().toISOString(),
    _lastBoot: "2026-09-28T19:51:48.611Z",
    _lastBootstrap: "2026-09-28T19:51:48.611Z",
    _registered: "2026-09-28T19:51:48.611Z",
    Device: {
      DeviceInfo: { HardwareVersion: { _value: "v1.0" }, SoftwareVersion: { _value: "6.49.18" } },
      ManagementServer: {
        PeriodicInformEnable: { _value: true },
        PeriodicInformInterval: { _value: 300 },
        ConnectionRequestURL: { _value: "http://192.168.88.1:7547/abc123" },
      },
      RootDataModelVersion: { _value: "2.11" },
    },
  };

  it("returns the full curated detail plus the raw record for a holder", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await makeDeviceStatusHolder(app);
    cleanups.push(cleanup);
    mockGenieAcsFetch([FULL_DEVICE]);

    const response = await app.inject({ method: "GET", url: "/api/genieacs/devices/bench-device", headers: { cookie } });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      id: "bench-device",
      manufacturer: "MikroTik",
      oui: "E48D8C",
      productClass: "hAP lite",
      serialNumber: "8CE6085532C7",
      hardwareVersion: "v1.0",
      softwareVersion: "6.49.18",
      rootDataModelVersion: "2.11",
      periodicInformEnabled: true,
      periodicInformIntervalSeconds: 300,
      connectionRequestUrl: "http://192.168.88.1:7547/abc123",
      status: "online",
    });
    expect(body.raw._id).toBe("bench-device");
  });

  it("returns 404 when GenieACS has no matching device", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await makeDeviceStatusHolder(app);
    cleanups.push(cleanup);
    mockGenieAcsFetch([]);

    const response = await app.inject({ method: "GET", url: "/api/genieacs/devices/unknown-device", headers: { cookie } });
    expect(response.statusCode).toBe(404);
  });

  it("returns 502 when GenieACS is unreachable", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await makeDeviceStatusHolder(app);
    cleanups.push(cleanup);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED")));

    const response = await app.inject({ method: "GET", url: "/api/genieacs/devices/bench-device", headers: { cookie } });
    expect(response.statusCode).toBe(502);
  });

  it("rejects an unauthenticated request with 401", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/api/genieacs/devices/bench-device" });
    expect(response.statusCode).toBe(401);
  });

  it("rejects an authenticated caller without view_device_status with 403", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await createTestSession(app);
    cleanups.push(cleanup);

    const response = await app.inject({ method: "GET", url: "/api/genieacs/devices/bench-device", headers: { cookie } });
    expect(response.statusCode).toBe(403);
  });
});
