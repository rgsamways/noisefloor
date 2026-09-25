import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

// Entities/groups/memberships/invitations — adapted from kerfy's
// companies/memberships/company_invitations (control-plane-schema.ts) to
// noisefloor's single-database reality: no databaseUrlEnvVar-style
// per-tenant resolution, since there is no per-entity business database
// to route to. See openspec/changes/add-entity-group-permissions design.md.

export const entities = pgTable("entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  name: text("name").notNull(),
});

export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
  },
  (table) => [uniqueIndex("groups_entity_name_idx").on(table.entityId, table.name)],
);

export const groupMembershipStatusEnum = pgEnum("group_membership_status", ["active", "revoked"]);

export const groupMemberships = pgTable(
  "group_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    // Ordered escalation level (e.g. Support's T1/T2/T3) — most groups
    // leave this null. Independently editable from `rules`, not derived
    // from or into it (design.md's Decision 3).
    tier: text("tier"),
    // The actual, individually-editable, enforced permission set for this
    // membership. Plain text, not an enum — see rules.ts's own comment.
    rules: text("rules").array().notNull().default([]),
    status: groupMembershipStatusEnum("status").notNull().default("active"),
  },
  (table) => [uniqueIndex("group_memberships_user_group_idx").on(table.userId, table.groupId)],
);

// Access granted by email, before the person has ever signed into
// noisefloor — mirrors kerfy's company_invitations exactly (see its own
// comment in kerfy's control-plane-schema.ts for why this isn't a
// nullable-userId row on groupMemberships itself). Converted into a real
// groupMemberships row the moment a matching email's identity resolves
// during sign-in (group-invitations.ts's applyPendingGroupInvitations).
export const groupInvitations = pgTable("group_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  // Stored lowercased/trimmed at write time — matching against a signed-in
  // identity's email must be case-insensitive.
  email: text("email").notNull(),
  tier: text("tier"),
  rules: text("rules").array().notNull().default([]),
  // No FK: the inviter may not exist by the time this is read back
  // (deleted account, etc.) — same reasoning as kerfy's own invitations.
  invitedByUserId: text("invited_by_user_id").notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
});
