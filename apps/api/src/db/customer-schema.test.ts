import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "./client.js";
import { customers, deviceTags, sites } from "./customer-schema.js";

describe("customers, sites, and device_tags", () => {
  const cleanups: Array<() => Promise<void>> = [];

  afterEach(async () => {
    for (const cleanup of cleanups.splice(0)) await cleanup();
  });

  async function makeCustomerWithSite() {
    const [customer] = await db.insert(customers).values({ name: `Test Customer ${crypto.randomUUID()}` }).returning();
    cleanups.push(async () => {
      await db.delete(customers).where(eq(customers.id, customer!.id));
    });
    const [site] = await db.insert(sites).values({ customerId: customer!.id, address: "123 Test Rd" }).returning();
    return { customer: customer!, site: site! };
  }

  it("creates a customer with a site", async () => {
    const { customer, site } = await makeCustomerWithSite();
    expect(site.customerId).toBe(customer.id);
  });

  it("allows a customer to have more than one site", async () => {
    const { customer } = await makeCustomerWithSite();
    const [secondSite] = await db.insert(sites).values({ customerId: customer.id, address: "456 Test Ave" }).returning();
    const allSites = await db.select().from(sites).where(eq(sites.customerId, customer.id));
    expect(allSites).toHaveLength(2);
    expect(secondSite!.customerId).toBe(customer.id);
  });

  it("tags a genieacs device and a uisp device to the same site independently", async () => {
    const { site } = await makeCustomerWithSite();
    await db.insert(deviceTags).values({ siteId: site.id, externalSystem: "genieacs", externalDeviceId: "genie-1" });
    await db.insert(deviceTags).values({ siteId: site.id, externalSystem: "uisp", externalDeviceId: "uisp-1" });

    const tags = await db.select().from(deviceTags).where(eq(deviceTags.siteId, site.id));
    expect(tags).toHaveLength(2);
  });

  it("rejects re-tagging an already-tagged external device id to a different site", async () => {
    const { site: siteA } = await makeCustomerWithSite();
    const { site: siteB } = await makeCustomerWithSite();
    await db.insert(deviceTags).values({ siteId: siteA.id, externalSystem: "genieacs", externalDeviceId: "genie-dup" });

    await expect(
      db.insert(deviceTags).values({ siteId: siteB.id, externalSystem: "genieacs", externalDeviceId: "genie-dup" }),
    ).rejects.toThrow();
  });

  it("allows the same external device id across different external systems", async () => {
    const { site } = await makeCustomerWithSite();
    await db.insert(deviceTags).values({ siteId: site.id, externalSystem: "genieacs", externalDeviceId: "shared-id" });
    await db.insert(deviceTags).values({ siteId: site.id, externalSystem: "uisp", externalDeviceId: "shared-id" });

    const tags = await db.select().from(deviceTags).where(eq(deviceTags.siteId, site.id));
    expect(tags).toHaveLength(2);
  });
});
