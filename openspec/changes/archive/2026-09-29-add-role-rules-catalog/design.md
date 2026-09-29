## Context

See proposal.md - Why. `packages/shared/src/schemas/rules.ts` currently exports only `SITE_RULE_KEYS`/`siteRuleKeySchema` (site-wide, checked via `hasSiteRule` in `apps/api/src/lib/site-admin.ts`). Group-scoped rules (`groupMemberships.rules`, `groupInvitations.rules`) are `text[]` columns with no catalog at all — `hasGroupRule` (`apps/api/src/lib/group-authorization.ts`) already enforces whatever strings happen to be in that array; this change only constrains what can be written there and gives an admin a real UI to write it.

## Goals / Non-Goals

**Goals:**
- A typed, exhaustive catalog of group-scoped rule keys for how a fixed-wireless ISP actually operates.
- Role templates as a pure convenience — applying one sets a membership's `rules` to that role's default set; nothing else ever reads "what role is this person," only the resulting `rules[]`.
- Admin UI to view/toggle a membership's or invitation's individual rules and apply a role.

**Non-Goals:**
- The sign-in routing gate and any `tickets` route (separate change, proposed after this one exists).
- Querying "my own rules across every group" for that gate (not needed until the gate change).
- Any change to `hasGroupRule`'s enforcement logic — it already reads `rules[]` correctly.
- A platform-operator tier above site-wide (kerfy's `PLATFORM_ONLY_RULES`/`impersonate_user` concept) — noisefloor has no multi-tenant platform layer above a single site's `siteAdmin`, so nothing maps onto that.

## Decisions

**Group-scoped rule catalog lives in `packages/shared/src/schemas/rules.ts`, alongside `SITE_RULE_KEYS`, not replacing it.** Same file, new exports: `GROUP_RULE_DOMAINS`, `ALL_GROUP_RULE_KEYS`, `groupRuleKeySchema`, `GroupRuleKey`. Plain strings via `z.enum`, not a DB enum — mirrors the existing `SITE_RULE_KEYS` comment's own reasoning (the catalog grows without a migration).

**11 domains** (dropping the "Platform & company administration" domain drafted in chat — those rules either duplicate `SITE_RULE_KEYS` already, or assume a platform tier that doesn't exist here):

```
tier1_support: view_customer_account, create_ticket, view_own_tickets, view_all_tickets,
  edit_own_ticket, close_ticket, escalate_ticket, view_device_status,
  reboot_customer_device, reset_customer_wifi
tier2_3_noc: view_radio_console, run_diagnostics, modify_device_config,
  view_network_topology, manage_backhaul_links, acknowledge_network_alerts, view_tower_status
field_installation: view_assigned_install_jobs, submit_install_completion,
  upload_site_survey_photos, record_signal_readings, request_install_equipment
provisioning_cpe: provision_new_device, tag_device_to_customer,
  view_device_inventory_status, manage_genieacs_presets, decommission_device
dispatch_scheduling: view_dispatch_schedule, edit_dispatch_schedule,
  assign_technician_to_job, view_own_schedule, clock_in_out
sales_accounts: create_customer_account, run_site_feasibility_check,
  create_service_quote, convert_quote_to_install_order, manage_service_plans
billing: view_customer_billing, manage_customer_billing, process_payment,
  issue_credit_or_refund, manage_billing_plans_catalog
inventory_warehouse: view_inventory_levels, adjust_inventory_counts,
  receive_equipment_shipment, process_device_rma, refurbish_returned_device
reporting_eod: submit_eod_report, view_own_eod_reports, view_all_eod_reports,
  manage_eod_report_settings
training_kb: view_kb_articles, use_training_console, view_own_training_progress,
  view_all_training_progress, access_case_scenarios
  (manage_kb_content stays in SITE_RULE_KEYS, not duplicated here — KB content
  is global, not per-group)
compliance_safety: manage_spectrum_licensing, manage_tower_site_agreements,
  view_compliance_documents, upload_compliance_documents, manage_safety_incident_reports
```

**12 role templates**, each a plain `GroupRuleKey[]` (exact sets as drafted in chat this session, `noc_manager` superset of `tier2_3_noc`, `site_admin` = every group rule key since `siteAdmin` already bypasses group checks entirely and this template is only meaningful if someone wants an *explicit* membership showing the same access):

```
site_admin, owner, tier1_support, tier2_3_noc_tech, noc_manager, field_installer,
dispatcher, sales_rep, billing_admin, warehouse_tech, compliance_officer, trainer
```

**Validation enforced at the API boundary, not the DB.** `apps/api/src/routes/admin.ts`'s `InviteBody` and `UpdateMembershipBody` (Zod schemas) change their `rules` field from `z.array(z.string())` to `z.array(groupRuleKeySchema)`. An invalid key fails Zod parsing the same way any other bad input does today (400, matching every other route's existing pattern) — no new error-handling shape.

**UI: rules grouped by domain as checkboxes, role application as a separate explicit action, not a checkbox.** In `AdminGroup.tsx`, applying a role is a distinct button/dropdown action that *replaces* the current rule set with that role's default (per spec's "Applying a role sets... to exactly the applied role's default rule set") — it is not itself a persisted toggle, so there's no "role" state to keep in sync with hand-edited rules afterward. Matches kerfy's own framing: a role is a one-time bulk-apply action, never a stored, ongoing classification.

## Risks / Trade-offs

- **A large checkbox list (11 domains × ~5 rules) is a lot of UI surface** → group by domain with collapsible sections or clear visual grouping (implementation detail for tasks.md), not a spec-level concern.
- **Role default-rule content is a judgment call about how NRN actually operates, not verified against a real org chart** → acceptable; roles are freely hand-edited after applying, so a wrong default costs one extra click per person, not a hard error. Confirm specific role contents with Robin during implementation if any look obviously wrong, same as kerfy's own confirmed exclusions (`lead_hand`/`office_admin` omitting quote access).

## Migration Plan

Additive to `packages/shared` (new exports, `SITE_RULE_KEYS` untouched) and to the UI (new controls). The one behavior change with real effect: `admin.ts`'s invite/update-membership endpoints start rejecting rule keys outside the catalog. No existing membership rows are affected retroactively (nothing re-validates already-stored `rules[]`); this only applies going forward, to new writes.

## Open Questions

- Exact role default-rule contents (e.g. should `dispatcher` see billing info, should `field_installer` see any pricing) are a best-guess starting point, not confirmed against real NRN org structure. Safe to defer — adjustable per-person after the fact with no spec/approach impact, same as kerfy's confirmed adjustments.
