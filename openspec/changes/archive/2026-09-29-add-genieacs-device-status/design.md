## Context

See proposal.md - Why. GenieACS exposes a plain HTTP/JSON NBI (Northbound Interface) on port 7557 with no built-in auth, documented in `docs/genieacs-portal-plan.md`. A device record looks like the sample in that doc: identity is `_deviceId` (manufacturer/OUI/product class/serial), online-ness is inferred from `_lastInform` recency (no explicit boolean), and each device optionally exposes its own `Device.ManagementServer.PeriodicInformInterval` (seconds between check-ins).

`apps/api` is Fastify 5 + Zod, with all existing routes gated by `requireSession` (see `apps/api/src/routes/eod-reports.ts`) and env vars validated through a single Zod schema in `apps/api/src/env.ts`.

## Goals / Non-Goals

**Goals:**
- Prove the noisefloor backend can call GenieACS's NBI and turn its response into a simple online/offline answer.
- Get the "recently checked in vs not" threshold decision made explicitly, since GenieACS doesn't hand it to us.

**Non-Goals:**
- Any customer-to-device mapping/persistence — that's plan doc prerequisite #2, a separate change.
- Any write action (reboot, connection request, parameter set) — read-only only.
- Any non-local network path (VPN/tunnel) — GenieACS is called over `localhost` in dev; securing a remote path is deferred until a non-local GenieACS instance exists.

## Decisions

**GenieACS base URL is an env var, not hardcoded.** Add `GENIEACS_NBI_URL` to `apps/api/src/env.ts`'s existing Zod schema, defaulting to `http://localhost:7557` (mirrors how `DATABASE_URL` etc. already default to local dev values in that file). Keeps the same code path working once GenieACS moves off the laptop — only the env var changes.

**Online/offline threshold: device's own `PeriodicInformInterval` × 2, falling back to a fixed default if absent.** GenieACS devices report how often they're expected to check in; a device is "offline" once it's missed roughly two expected check-ins. If a device record has no `PeriodicInformInterval` (some vendors omit it), fall back to a fixed default of 15 minutes. Alternative considered: a single fixed threshold for all devices — rejected because check-in intervals vary by device/vendor config (the sample record's MikroTik uses 300s; others may differ), so a single fixed window would flag some devices offline right after a normal check-in.

**Route shape: `GET /api/genieacs/devices/:deviceId/status` — moved a third time, now for good reason.** Started as this exact path (requireSession), moved to `/api/admin/genieacs/...` (requireSiteAdmin) when it briefly lived only on the Admin page, and now moves back out of the `/api/admin/*` namespace entirely: that namespace's whole contract is "gated by requireSiteAdmin alone" (`admin.ts`'s own comment), and this route no longer is. `:deviceId` is GenieACS's own `_id` string, URL-encoded by the caller (it contains characters like `%20`, per the sample in the plan doc).

**Gated by `requireGroupRule("view_device_status")`, not `requireSiteAdmin`.** Superseded again: rebooting/checking a device is an action taken *while working a ticket*, not an admin-only tool — restricting it to siteAdmin would block the exact T1/T2 support staff it's for. Uses the `requireGroupRule` guard built in `add-signin-hub` (same session, same helper `getMyGroupRules` backs both). `view_device_status` already exists in the Tier 1 support rule domain from `add-role-rules-catalog` — no new rule needed. `siteAdmin` still passes via that guard's existing exemption.

**Lives on a new Tickets page, not Admin.** Moved out of `apps/web/src/pages/Admin.tsx` entirely into a new `apps/web/src/pages/Tickets.tsx` (built in `add-signin-hub`, reachable from the Hub's Tickets card) — matching the file's existing HUD styling conventions rather than `Admin.tsx`'s `GroupsSection`/`UsersSection`/`SettingsSection` pattern, since it's no longer an admin feature. Still the same minimal lookup panel: one text input for a raw GenieACS device ID, one lookup button, a status display. No device list, no search, no write actions — the goal is still a working door into GenieACS, not a support-agent workflow (that still needs the customer-to-device mapping in plan doc prerequisite #2 first). Real ticket CRUD doesn't exist yet; this page is deliberately just this panel for now, built so it can grow into a real ticket workflow later without moving again.

**Not-found vs unreachable are different HTTP statuses.** GenieACS returns an empty result for an unknown device ID (not an HTTP error) — the client module treats an empty NBI response as 404. A network-level failure (connection refused, timeout) is surfaced as 502, so a caller can tell "this device doesn't exist" apart from "GenieACS is down," which matters once this endpoint is depended on by a support workflow.

## Risks / Trade-offs

- **GenieACS is unauthenticated and reachable at `localhost:7557`** → acceptable for now since it's a same-machine call in local dev only; revisit before anything talks to a non-local GenieACS instance (plan doc prerequisite #3, explicitly out of scope here).
- **The ×2 threshold heuristic can misjudge devices with irregular check-in behavior** → acceptable for a read-only status proof; if it proves unreliable in practice, tune the multiplier or fallback in a later change rather than blocking this one.

## Migration Plan

Mostly additive: new env var (with a working default, so existing `.env` files don't need changes to keep running), new client module. The route and its UI move a third time in this same change — from `/api/admin/genieacs/...` on the Admin page to `/api/genieacs/...` on a new Tickets page — acceptable because the admin-gated version shipped only within this same session, with no real external consumer yet. No rollback beyond removing the route and page.
