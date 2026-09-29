import { and, eq, or } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { customers, deviceTags, sites } from "../db/customer-schema.js";
import { db } from "../db/client.js";
import { requireGroupRule } from "../lib/group-authorization.js";
import { requireSiteAdmin } from "../lib/site-admin.js";

const CreateCustomerBody = z.object({
  name: z.string().min(1),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().min(1).nullable().optional(),
  site: z.object({ address: z.string().min(1) }),
});
const CreateSiteBody = z.object({ address: z.string().min(1) });
const CreateDeviceTagBody = z.object({
  externalSystem: z.enum(["genieacs", "uisp"]),
  externalDeviceId: z.string().min(1),
});

async function loadCustomerSnapshot(customerId: string) {
  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
  if (!customer) return null;

  const customerSites = await db.select().from(sites).where(eq(sites.customerId, customerId));
  const tags = customerSites.length
    ? await db.select().from(deviceTags).where(
        or(...customerSites.map((site) => eq(deviceTags.siteId, site.id))),
      )
    : [];

  return {
    customer,
    sites: customerSites.map((site) => ({
      ...site,
      deviceTags: tags.filter((tag) => tag.siteId === site.id),
    })),
  };
}

// Tagging/creation stay siteAdmin-only (matches admin.ts's own scope for
// the permission/directory data this builds on); the search endpoint is
// gated by view_device_status instead, since that's the rule T1/T2
// support already holds to look up a device — a customer search is the
// same lookup by a different starting term, not a separate permission
// (design.md's reasoning for reusing view_device_status on the UISP
// route applies equally here).
export async function customersRoute(app: FastifyInstance) {
  // Not in the original task list — added because the admin UI (task
  // 5.1) needs some way to browse existing customers to add a site or
  // tag a device to them; without this, the page would only ever work
  // within the same session a customer was created in.
  app.get("/api/admin/customers", { preHandler: requireSiteAdmin }, async () => {
    const [allCustomers, allSites, allTags] = await Promise.all([
      db.select().from(customers).orderBy(customers.name),
      db.select().from(sites),
      db.select().from(deviceTags),
    ]);

    return allCustomers.map((customer) => ({
      ...customer,
      sites: allSites
        .filter((site) => site.customerId === customer.id)
        .map((site) => ({ ...site, deviceTags: allTags.filter((tag) => tag.siteId === site.id) })),
    }));
  });

  app.post("/api/admin/customers", { preHandler: requireSiteAdmin }, async (request, reply) => {
    const parsed = CreateCustomerBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: "invalid body" });

    const [customer] = await db
      .insert(customers)
      .values({
        name: parsed.data.name,
        contactEmail: parsed.data.contactEmail ?? null,
        contactPhone: parsed.data.contactPhone ?? null,
      })
      .returning();
    const [site] = await db.insert(sites).values({ customerId: customer!.id, address: parsed.data.site.address }).returning();

    return reply.status(201).send({ customer, sites: [site] });
  });

  app.post<{ Params: { id: string } }>(
    "/api/admin/customers/:id/sites",
    { preHandler: requireSiteAdmin },
    async (request, reply) => {
      const parsed = CreateSiteBody.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: "invalid body" });

      const [customer] = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, request.params.id));
      if (!customer) return reply.status(404).send({ error: "customer not found" });

      const [site] = await db.insert(sites).values({ customerId: customer.id, address: parsed.data.address }).returning();
      return reply.status(201).send(site);
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/admin/sites/:id/device-tags",
    { preHandler: requireSiteAdmin },
    async (request, reply) => {
      const parsed = CreateDeviceTagBody.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: "invalid body" });

      const [site] = await db.select({ id: sites.id }).from(sites).where(eq(sites.id, request.params.id));
      if (!site) return reply.status(404).send({ error: "site not found" });

      const [existingTag] = await db
        .select({ id: deviceTags.id })
        .from(deviceTags)
        .where(
          and(
            eq(deviceTags.externalSystem, parsed.data.externalSystem),
            eq(deviceTags.externalDeviceId, parsed.data.externalDeviceId),
          ),
        );
      if (existingTag) return reply.status(409).send({ error: "this device is already tagged to a site" });

      const [tag] = await db
        .insert(deviceTags)
        .values({ siteId: site.id, externalSystem: parsed.data.externalSystem, externalDeviceId: parsed.data.externalDeviceId })
        .returning();
      return reply.status(201).send(tag);
    },
  );

  app.get<{ Querystring: { term?: string } }>(
    "/api/customers/search",
    { preHandler: requireGroupRule("view_device_status") },
    async (request, reply) => {
      const term = request.query.term?.trim();
      if (!term) return reply.status(400).send({ error: "term is required" });

      const [customerByName] = await db.select({ id: customers.id }).from(customers).where(eq(customers.name, term));
      if (customerByName) return loadCustomerSnapshot(customerByName.id);

      const [siteByAddress] = await db.select({ customerId: sites.customerId }).from(sites).where(eq(sites.address, term));
      if (siteByAddress) return loadCustomerSnapshot(siteByAddress.customerId);

      const [tagMatch] = await db.select({ siteId: deviceTags.siteId }).from(deviceTags).where(eq(deviceTags.externalDeviceId, term));
      if (tagMatch) {
        const [site] = await db.select({ customerId: sites.customerId }).from(sites).where(eq(sites.id, tagMatch.siteId));
        if (site) return loadCustomerSnapshot(site.customerId);
      }

      return { customer: null, sites: [] };
    },
  );
}
