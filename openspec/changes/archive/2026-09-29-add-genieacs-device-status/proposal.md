## Why

NRN has no automated way to check whether a customer's CPE is online without opening GenieACS's own generic admin UI and knowing the device's serial number. A bench trial (`docs/genieacs-sagemcom-trial-handoff.md`) confirmed GenieACS can manage real hardware (MikroTik hAP Lite, 2026-09-28), and `docs/genieacs-portal-plan.md` lays out a tier-1 support portal built on top of it. This change is that plan's step 1: prove noisefloor's backend can talk to GenieACS's NBI (REST API) and surface a device's online/offline status, before any write actions (reboot, Wi-Fi reset) or customer-facing UI are built.

## What Changes

- Add a GenieACS NBI client to `apps/api` that calls a locally-running GenieACS instance (`http://localhost:7557` in dev) to fetch a single device's record by device ID.
- Add a read-only endpoint that takes a GenieACS device ID, calls the NBI, and returns online/offline status (derived from `_lastInform` recency, not an explicit field) plus the last-inform timestamp.
- No customer-to-device mapping layer yet — the endpoint takes GenieACS's own device ID directly. Customer lookup is an open design decision (plan doc prerequisite #2) and out of scope here.
- No write actions (reboot, Wi-Fi reset) — read-only status only, per the plan doc's build order.
- No production network path — GenieACS is reached over `localhost` for local dev/testing only. Securing the NBI path for a deployed environment (plan doc prerequisite #3) is out of scope until noisefloor is calling a non-local GenieACS instance.
- Add a minimal lookup panel — a device-ID input, a lookup button, and a status display — so this capability has a real door into the app instead of staying API-only. It briefly lived on the Admin page (`GET /api/admin/genieacs/devices/:deviceId/status`, `requireSiteAdmin`), then moved again: it now lives on a new Tickets page at `GET /api/genieacs/devices/:deviceId/status`, gated by the `view_device_status` group rule instead — checking a device is a ticket-handling action for T1/T2 support, not an admin-only tool.

## Capabilities

### New Capabilities
- `genieacs-device-status`: backend capability for querying a GenieACS-managed device's online/offline status and last-inform time by device ID, via GenieACS's NBI.

### Modified Capabilities
(none)

## Impact

- Affected code: `apps/api` (new route, new GenieACS client module, new env var for the NBI base URL) and `apps/web` (new Admin page section).
- New dependency: none required — NBI is plain HTTP/JSON, reachable with `fetch`.
- No database schema changes (no customer/device mapping persisted yet).
