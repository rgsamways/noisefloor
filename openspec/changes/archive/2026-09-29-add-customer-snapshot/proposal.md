## Why

A T1 tech working a ticket today can only look up a device by its raw GenieACS device ID — there's no way to search by customer name, address, or IP, and no way to see a customer's radio (UISP) and router (GenieACS) readings together. Robin's stated vision: search by anything, get back the customer's whole setup as one "snapshot." This is explicitly a big, multi-phase job — this proposal scopes a first real slice (the customer/device-mapping foundation, a UISP client mirroring the existing GenieACS one, and exact-match search), not the full vision at once.

## What Changes

- Add a `customer`/`site` data model (Robin's explicit naming — "customer," not "contact" — from the meridian-inspired design already parked in project memory): a customer has a name and contact info; a site is a physical install location; a customer can have multiple sites.
- Add a `device_tag` table linking a customer's site to a device in an external system (`genieacs` or `uisp`) by that system's own device ID — the mapping GenieACS's own data model has no concept of.
- Add a minimal admin-side UI to create a customer/site and tag a device to it — manual tagging only; automating this at install/provisioning time is future work, not this change.
- Add a UISP client (`apps/api/src/lib/uisp-client.ts`, mirroring `genieacs-client.ts`) and a device-detail computation (mirroring `genieacs-device-detail.ts`), using the API shape confirmed this session (see design.md) — read-only, no write/control endpoints, matching GenieACS's own scope so far.
- Add an exact-match search on the Tickets page: a search box that resolves a customer name, site address, GenieACS device ID, UISP device ID, or IP to a customer record — **exact match only in this pass**; fuzzy/partial matching is explicitly deferred (see design.md's Open Questions).
- Add a customer snapshot screen: given a resolved customer, show their GenieACS device(s) and UISP device(s) side by side, reusing the existing `DeviceDetail.tsx` GenieACS view and a new equivalent UISP view.

## Capabilities

### New Capabilities
- `customer-directory`: the customer/site data model, device-to-customer tagging, and the admin UI to manage both.
- `uisp-client`: backend integration with UISP's REST API — device listing, per-device detail, online/offline status — and the UISP device-detail screen.

### Modified Capabilities
(none — this is additive alongside the existing `genieacs-device-status` capability, not a change to it)

## Impact

- Affected code: new `apps/api/src/db` tables (customers, sites, device_tags), new `apps/api/src/lib/uisp-client.ts` + `uisp-device-detail.ts`, new routes, new `apps/web/src/pages` for admin tagging + the snapshot screen + the UISP device view, changes to `Tickets.tsx` to add the search box.
- New env vars: a UISP base URL + API token, following `GENIEACS_NBI_URL`'s existing pattern in `env.ts`.
- New database schema (customers, sites, device_tags) — a real, permanent addition, not a stopgap.
- No real UISP credentials exist for NRN yet in this project — the client is built and tested against mocked responses (same as GenieACS's own client was), with real end-to-end verification deferred until Robin has an actual token to test against.
