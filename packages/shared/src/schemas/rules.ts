import { z } from "zod";

// A small starter site-wide permission catalog — deliberately minimal.
// Department-specific (group-scoped) permissions are forward-looking per
// Robin ("I'd rather think on that more as the rest of the site develops")
// and get added once the features needing them exist. Adapted from kerfy's
// packages/shared/src/schemas/rules.ts (ALL_RULE_KEYS/ruleKeySchema):
// plain strings, not a DB enum, so the catalog grows without a migration.
// See openspec/changes/add-entity-group-permissions design.md's Decision 4.
export const SITE_RULE_KEYS = ["manage_users", "manage_groups", "manage_entities", "manage_kb_content"] as const;

export const siteRuleKeySchema = z.enum(SITE_RULE_KEYS);
export type SiteRuleKey = (typeof SITE_RULE_KEYS)[number];
