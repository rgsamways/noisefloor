import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

// customers/sites/device_tags — the "whose infrastructure is this"
// model, deliberately separate from entities/groups (which model "who
// has access to what feature"). See
// openspec/changes/add-customer-snapshot design.md's Decisions.
//
// Field set is a deliberate first pass, not final — design.md's own
// Open Questions defers "exact customer/site schema fields beyond name +
// contact + site location" to implementation-time refinement. Expect
// this to change.

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  name: text("name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
});

export const sites = pgTable("sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  address: text("address").notNull(),
});

export const externalSystemEnum = pgEnum("external_system", ["genieacs", "uisp"]);

// A thin join only — GenieACS/UISP stay the source of truth for the
// device's own data; this table only ever stores the pointer to it.
// The unique index enforces the spec's "one device, one site" rule.
export const deviceTags = pgTable(
  "device_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    externalSystem: externalSystemEnum("external_system").notNull(),
    externalDeviceId: text("external_device_id").notNull(),
  },
  (table) => [uniqueIndex("device_tags_system_device_idx").on(table.externalSystem, table.externalDeviceId)],
);
