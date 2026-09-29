## Context

See proposal.md - Why. Three existing things this builds directly on: `apps/api/src/lib/genieacs-client.ts`/`genieacs-device-detail.ts` (the pattern to mirror for UISP), `apps/api/src/lib/group-authorization.ts`'s `requireGroupRule` (the gating mechanism), and the customer/site naming already parked in `[[project_noisefloor_hub_and_tickets_design]]` memory. UISP's REST API shape (base path, auth, endpoint quirks) was confirmed this session via `C:\dev\meridian`'s own tested — but never against NRN's real tenant — adapter; see that project's `src-tauri/src/devices/uisp.rs` if more detail than what's summarized in Decisions below is ever needed.

## Goals / Non-Goals

**Goals:**
- A real customer/site data model that both GenieACS and UISP device IDs can tag against.
- A UISP client at the same maturity level GenieACS's already is: read-only, mocked-fetch-tested, not yet verified against a real production instance.
- Exact-match search only — prove the resolution mechanism works before making it fuzzy.

**Non-Goals:**
- Fuzzy/partial-match search (name contains, address soundex, etc.) — explicitly deferred, see Open Questions.
- Automating device-to-customer tagging at install/provisioning time — this change is manual tagging only.
- Any UISP write/control action (reboot, config push) — matches GenieACS's own still-read-only scope.
- IP-based search — deferred, see Open Questions; not in the `customer-directory` spec's requirement.

## Decisions

**`customers` and `sites` as their own tables, not folded into the existing `entities`/`groups` permission model.** `entities`/`groups` model *who has access to what feature* (staff, permissions); customers/sites model *whose infrastructure this is* (subscribers). Conflating them would mean a customer accidentally becomes a permission-bearing entity, which they aren't.

**`device_tags` is a thin join, not a foreign key on the device data itself.** GenieACS and UISP both remain the source of truth for their own device data — noisefloor never stores a device's live readings, only `{ externalSystem: "genieacs" | "uisp", externalDeviceId, siteId }`. A unique constraint on `(externalSystem, externalDeviceId)` enforces the "one device, one site" rule from the spec.

**UISP client mirrors `genieacs-client.ts`'s exact shape**: a `fetchUispDevice(deviceId)` returning `null` on not-found, throwing a `UispUnavailableError` (mirroring `GenieAcsUnavailableError`) on network/unreachable failures. `env.ts` gains `UISP_BASE_URL` and `UISP_API_TOKEN`, following `GENIEACS_NBI_URL`'s pattern — no default for the token (unlike GenieACS's local-dev-friendly default), since there's no safe placeholder for a credential.

**Self-signed cert handling: a per-request undici `Agent` with `rejectUnauthorized: false`, not the global `NODE_TLS_REJECT_UNAUTHORIZED=0` env var.** The global env var disables cert validation for every outbound request the whole process makes (a real security regression for everything else); Node's `fetch` accepts a custom `dispatcher` option that can scope this to UISP calls only. Needs verification once there's a real UISP instance to test against — this is a decision about the *right* approach, not yet proven working in this codebase.

**UISP device detail is gated by the same `view_device_status` rule GenieACS uses, not a new `view_radio_status` rule.** The rule already reads as "can view a device's status," not "can view a router's status specifically" — a second near-duplicate rule would fragment the same permission across two names for no real access-control benefit.

**Device-family dispatch (airMax vs. other UISP hardware families) is a lookup table, not a generic per-family plugin system.** Only `airMax` is confirmed relevant to NRN's fleet so far (per meridian's own docs); building a generic extensible dispatch mechanism for hardware families nobody's confirmed NRN uses yet is speculative complexity. Add families as they're actually needed.

## Risks / Trade-offs

- **The UISP client is built and tested entirely against mocked responses — genuinely unverified against NRN's real UISP tenant, or even against a real UISP instance at all in this codebase.** Acceptable for the same reason it was for GenieACS initially: proves the integration shape before real credentials exist. Flag clearly when this ships that "works in tests" ≠ "confirmed against NRN's real radios."
- **Manual device tagging doesn't scale past a handful of test customers.** Acceptable as the first slice; automating it is explicitly future work once this manual mechanism proves out.

## Migration Plan

Additive: two new tables (`customers`, `sites`, `device_tags`), new env vars, new routes/pages. Nothing existing changes shape — `genieacs-device-status` and its routes are untouched.

## Open Questions

- **Exact customer/site schema fields beyond name + contact + site location** — deferred to implementation-time refinement per Robin's own "we'll be spending a lot of time refining it."
- **How device-to-customer tagging happens operationally long-term** (at install time vs. retroactive admin action) — this change only builds the manual mechanism; the operational workflow question stays open.
- **Where the tagging admin UI actually lives** — a section on an existing admin page, or its own — not decided; a placeholder location is fine for now and easy to move.
- **IP-based search** — deferred entirely. Unlike a device ID, an IP isn't necessarily stored anywhere stable (fixed-wireless customers may sit behind CGNAT, and neither GenieACS nor UISP's confirmed endpoints were checked for a queryable-at-search-time IP field). Needs its own investigation before it's promised as a search term.
- **Whether NRN has an actual UISP API token provisioned yet** — if not, this entire capability stays mock-tested until one exists, same as GenieACS's own real-hardware verification waited for the bench trial.
