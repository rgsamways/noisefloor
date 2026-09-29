import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { user } from "../db/auth-schema.js";
import { db } from "../db/client.js";
import { customers, deviceTags, sites } from "../db/customer-schema.js";
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

describe("customer directory routes", () => {
  const cleanups: Array<() => Promise<void>> = [];
  const customerIds: string[] = [];

  afterEach(async () => {
    for (const id of customerIds.splice(0)) await db.delete(customers).where(eq(customers.id, id));
    for (const cleanup of cleanups.splice(0)) await cleanup();
  });

  describe("GET /api/admin/customers", () => {
    it("lists a created customer with its sites and device tags", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);

      const [customer] = await db.insert(customers).values({ name: `List Test ${crypto.randomUUID()}` }).returning();
      customerIds.push(customer!.id);
      const [site] = await db.insert(sites).values({ customerId: customer!.id, address: "List Rd" }).returning();
      await db.insert(deviceTags).values({ siteId: site!.id, externalSystem: "genieacs", externalDeviceId: `genie-list-${crypto.randomUUID()}` });

      const response = await app.inject({ method: "GET", url: "/api/admin/customers", headers: { cookie } });
      expect(response.statusCode).toBe(200);
      const body = response.json() as Array<{ id: string; sites: Array<{ deviceTags: unknown[] }> }>;
      const found = body.find((c) => c.id === customer!.id);
      expect(found?.sites).toHaveLength(1);
      expect(found?.sites[0]?.deviceTags).toHaveLength(1);
    });
  });

  describe("POST /api/admin/customers", () => {
    it("creates a customer with its first site", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);

      const response = await app.inject({
        method: "POST",
        url: "/api/admin/customers",
        headers: { cookie },
        payload: { name: `Jane Test ${crypto.randomUUID()}`, site: { address: "123 Test Rd" } },
      });
      expect(response.statusCode).toBe(201);
      const body = response.json();
      customerIds.push(body.customer.id);
      expect(body.sites).toHaveLength(1);
      expect(body.sites[0].address).toBe("123 Test Rd");
    });
  });

  describe("POST /api/admin/customers/:id/sites", () => {
    it("adds a second site to an existing customer", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);

      const [customer] = await db.insert(customers).values({ name: `Multi Site ${crypto.randomUUID()}` }).returning();
      customerIds.push(customer!.id);
      await db.insert(sites).values({ customerId: customer!.id, address: "First Rd" });

      const response = await app.inject({
        method: "POST",
        url: `/api/admin/customers/${customer!.id}/sites`,
        headers: { cookie },
        payload: { address: "Second Rd" },
      });
      expect(response.statusCode).toBe(201);

      const allSites = await db.select().from(sites).where(eq(sites.customerId, customer!.id));
      expect(allSites).toHaveLength(2);
    });
  });

  describe("POST /api/admin/sites/:id/device-tags", () => {
    it("tags a device to a site", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);

      const [customer] = await db.insert(customers).values({ name: `Tag Test ${crypto.randomUUID()}` }).returning();
      customerIds.push(customer!.id);
      const [site] = await db.insert(sites).values({ customerId: customer!.id, address: "Tag Rd" }).returning();

      const response = await app.inject({
        method: "POST",
        url: `/api/admin/sites/${site!.id}/device-tags`,
        headers: { cookie },
        payload: { externalSystem: "genieacs", externalDeviceId: `genie-${crypto.randomUUID()}` },
      });
      expect(response.statusCode).toBe(201);
    });

    it("rejects tagging an already-tagged external device id to a different site", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeSiteAdmin(app);
      cleanups.push(cleanup);

      const [customer] = await db.insert(customers).values({ name: `Tag Conflict ${crypto.randomUUID()}` }).returning();
      customerIds.push(customer!.id);
      const [siteA] = await db.insert(sites).values({ customerId: customer!.id, address: "Site A" }).returning();
      const [siteB] = await db.insert(sites).values({ customerId: customer!.id, address: "Site B" }).returning();
      const deviceId = `genie-dup-${crypto.randomUUID()}`;
      await db.insert(deviceTags).values({ siteId: siteA!.id, externalSystem: "genieacs", externalDeviceId: deviceId });

      const response = await app.inject({
        method: "POST",
        url: `/api/admin/sites/${siteB!.id}/device-tags`,
        headers: { cookie },
        payload: { externalSystem: "genieacs", externalDeviceId: deviceId },
      });
      expect(response.statusCode).toBe(409);
    });
  });

  describe("GET /api/customers/search", () => {
    async function makeTaggedCustomer() {
      const name = `Search Target ${crypto.randomUUID()}`;
      const [customer] = await db.insert(customers).values({ name }).returning();
      customerIds.push(customer!.id);
      const [site] = await db.insert(sites).values({ customerId: customer!.id, address: `Search Rd ${crypto.randomUUID()}` }).returning();
      const genieId = `genie-search-${crypto.randomUUID()}`;
      const uispId = `uisp-search-${crypto.randomUUID()}`;
      await db.insert(deviceTags).values({ siteId: site!.id, externalSystem: "genieacs", externalDeviceId: genieId });
      await db.insert(deviceTags).values({ siteId: site!.id, externalSystem: "uisp", externalDeviceId: uispId });
      return { customer: customer!, site: site!, name, genieId, uispId };
    }

    it("resolves a customer by exact name", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeDeviceStatusHolder(app);
      cleanups.push(cleanup);
      const { customer, name } = await makeTaggedCustomer();

      const response = await app.inject({ method: "GET", url: `/api/customers/search?term=${encodeURIComponent(name)}`, headers: { cookie } });
      expect(response.statusCode).toBe(200);
      expect(response.json().customer.id).toBe(customer.id);
    });

    it("resolves the owning customer by a tagged GenieACS device id", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeDeviceStatusHolder(app);
      cleanups.push(cleanup);
      const { customer, genieId } = await makeTaggedCustomer();

      const response = await app.inject({ method: "GET", url: `/api/customers/search?term=${encodeURIComponent(genieId)}`, headers: { cookie } });
      expect(response.statusCode).toBe(200);
      expect(response.json().customer.id).toBe(customer.id);
    });

    it("resolves the owning customer by a tagged UISP device id", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeDeviceStatusHolder(app);
      cleanups.push(cleanup);
      const { customer, uispId } = await makeTaggedCustomer();

      const response = await app.inject({ method: "GET", url: `/api/customers/search?term=${encodeURIComponent(uispId)}`, headers: { cookie } });
      expect(response.statusCode).toBe(200);
      expect(response.json().customer.id).toBe(customer.id);
    });

    it("returns a clean no-match result for an unmatched term", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await makeDeviceStatusHolder(app);
      cleanups.push(cleanup);

      const response = await app.inject({ method: "GET", url: `/api/customers/search?term=nobody-${crypto.randomUUID()}`, headers: { cookie } });
      expect(response.statusCode).toBe(200);
      expect(response.json().customer).toBeNull();
    });

    it("rejects a caller without view_device_status with 403", async () => {
      const app = buildApp();
      const { cookie, cleanup } = await createTestSession(app);
      cleanups.push(cleanup);

      const response = await app.inject({ method: "GET", url: "/api/customers/search?term=anything", headers: { cookie } });
      expect(response.statusCode).toBe(403);
    });
  });
});
