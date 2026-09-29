## Why

`entity-group-permissions` shipped the data model for group-scoped rules (`groupMemberships.rules`) but deliberately left the actual catalog empty — "department-specific (group-scoped) permissions are forward-looking... and get added once the features needing them exist" (`packages/shared/src/schemas/rules.ts`'s own comment). That moment has arrived: noisefloor now has real group-scoped features to gate (the GenieACS device-status admin panel, EOD reports, an upcoming support-ticket workflow), and there's still no defined catalog of what a group membership's `rules` can even contain — today it's an untyped `text[]` accepting any string, and there's no UI to assign rules or roles to a person at all (`AdminGroup.tsx` only has a freeform `tier` text field).

## What Changes

- Add a real, typed catalog of group-scoped rule keys to `packages/shared`, organized into domains modeled on how a fixed-wireless ISP (NRN) actually operates: Tier 1 support, Tier 2/3 support & NOC, Field installation, Provisioning & CPE management, Dispatch & scheduling, Sales & account management, Billing & accounts, Inventory/warehouse & RMA, Reporting & EOD, Training & knowledge base, Compliance & safety.
- Add role-based default-rule templates (`site_admin`, `owner`, `tier1_support`, `tier2_tier3_support`, `noc_manager`, `field_installer`, `dispatcher`, `sales_rep`, `billing_admin`, `warehouse_tech`, `compliance_officer`, `trainer`) — mirroring kerfy's exact pattern: a role is a bulk-apply convenience only, carries no enforcement weight of its own, and a person's actual `rules[]` is freely hand-edited afterward independent of whichever role's default set was last applied.
- **BREAKING (internal only, no external consumers yet)**: `apps/api`'s invite and membership-update request bodies now validate `rules` against the real catalog instead of accepting any string.
- Add rule-editing (checkboxes) and a role picker to `AdminGroup.tsx`'s invite form and member rows.
- Fold `manage_kb_content` back into the existing site-wide catalog (`SITE_RULE_KEYS`) rather than duplicating it group-scoped — KB content isn't per-group data, so managing it is a site-wide concern; only *reading* KB articles and using the training console are group-scoped.

## Capabilities

### New Capabilities
- `role-rules-catalog`: the typed group-scoped rule-key catalog, role default-rule templates, and the admin UI for assigning rules/roles to a group membership or invitation.

### Modified Capabilities
- `entity-group-permissions`: a group membership's or invitation's `rules` must now validate against the defined rule-key catalog; previously any string was accepted.

## Impact

- Affected code: `packages/shared/src/schemas/rules.ts` (extended, not replaced — `SITE_RULE_KEYS` stays as-is), `apps/api/src/routes/admin.ts` (`InviteBody`/`UpdateMembershipBody` validation), `apps/web/src/pages/AdminGroup.tsx` (new UI).
- No database schema change — `groupMemberships.rules`/`groupInvitations.rules` stay `text[]`, matching kerfy's own reasoning (plain strings, not a DB enum, so the catalog grows without a migration).
- No change to `hasGroupRule`'s enforcement logic itself (`apps/api/src/lib/group-authorization.ts`) — it already reads whatever is in `rules[]`; this change only constrains what can be written there.
