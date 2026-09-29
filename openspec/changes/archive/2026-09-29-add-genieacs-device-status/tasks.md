## 1. Config

- [x] 1.1 Add `GENIEACS_NBI_URL` to `apps/api/src/env.ts`'s Zod schema, defaulting to `http://localhost:7557`, and verify `pnpm --filter @noisefloor/api typecheck` passes
- [x] 1.2 Add `GENIEACS_NBI_URL` to `apps/api/.env.example` with a comment noting the local-dev default, and verify the file documents it

## 2. GenieACS client module

- [x] 2.1 Create a GenieACS NBI client module (e.g. `apps/api/src/lib/genieacs-client.ts`) with a function that fetches a single device by ID from `${GENIEACS_NBI_URL}/devices/?query=...` and returns `null` when GenieACS reports no matching device, and verify a unit test covers both the found and not-found cases against a mocked fetch
- [x] 2.2 Add a distinct error type/path for network-level failures (fetch throws, non-2xx from GenieACS itself) so callers can tell "unreachable" apart from "not found," and verify a unit test covers the unreachable case
- [x] 2.3 Implement the online/offline + threshold logic from design.md (device's `PeriodicInformInterval` × 2, falling back to a 15-minute default when absent) as a pure function taking `_lastInform` and the interval, and verify unit tests cover: recently-checked-in, stale, and missing-interval-uses-fallback cases

## 3. Route (admin-gated)

- [x] 3.1 Move the route to `GET /api/admin/genieacs/devices/:deviceId/status`, gated by `requireSiteAdmin` as a Fastify `preHandler` (matching the pattern in `apps/api/src/routes/admin.ts`), reusing the existing `fetchGenieAcsDevice`/`computeDeviceStatus` lib functions unchanged, and verify an integration test covers: site-admin + device online, site-admin + device offline
- [x] 3.2 Wire the not-found case to a 404 response and the unreachable case to a 502 response, and verify integration tests cover both
- [x] 3.3 Wire the unauthenticated case to 401 and the authenticated-but-not-site-admin case to 403 (matching `requireSiteAdmin`'s own behavior), and verify integration tests cover both
- [x] 3.4 Remove the old `GET /api/genieacs/devices/:deviceId/status` route, its route file, and its integration test file (no other consumer exists), and verify `pnpm --filter @noisefloor/api typecheck` and the test suite still pass

## 4. Admin page panel

- [x] 4.1 Add a new section to `apps/web/src/pages/Admin.tsx` (matching the existing `GroupsSection`/`UsersSection`/`SettingsSection` function-component pattern and `LINE`/`TEXT`/`MUTED`/`ACCENT` color constants): a text input for a raw GenieACS device ID and a lookup button
- [x] 4.2 Wire the lookup button to `GET /api/admin/genieacs/devices/:deviceId/status` via `apiFetch`, and display the result (status + last-inform time) or the error message, matching the loading/error patterns already used elsewhere in the file
- [x] 4.3 Verify manually in the browser: sign in as a site admin, visit `/admin`, and confirm the new section renders and is usable

## 5. Manual verification against the bench device

- [x] 5.1 With GenieACS running locally and the MikroTik hAP Lite bench unit checked in, call the new endpoint with its real device ID and confirm the response shows "online" with a recent `_lastInform`
- [x] 5.2 Power off or disconnect the bench unit, wait past its inform interval, and confirm the endpoint flips to "offline" without restarting the noisefloor backend

## 6. Relocate to the Tickets page (rule-gated, not admin-only)

- [x] 6.1 Move the route from `GET /api/admin/genieacs/devices/:deviceId/status` to `GET /api/genieacs/devices/:deviceId/status`, replacing the `requireSiteAdmin` preHandler with `requireGroupRule("view_device_status")` (built in `add-signin-hub`), reusing the existing `fetchGenieAcsDevice`/`computeDeviceStatus` lib functions unchanged, and verify integration tests cover: a `view_device_status` holder + device online, a holder + device offline, a non-holder gets 403, siteAdmin succeeds without the rule
- [x] 6.2 Delete the old `apps/api/src/routes/admin-genieacs.ts` route file and its test (no other consumer), and verify `pnpm --filter @noisefloor/api typecheck` and the test suite still pass
- [x] 6.3 Remove the GenieACS section from `apps/web/src/pages/Admin.tsx` and add it to the new `apps/web/src/pages/Tickets.tsx` (built in `add-signin-hub`), matching that file's styling rather than `Admin.tsx`'s section pattern
- [x] 6.4 Verify manually in the browser: sign in as a non-siteAdmin account holding `view_device_status` (e.g. via the `tier1_support` role), visit the Tickets page, and confirm the lookup panel works without needing siteAdmin — confirmed live via Playwright: a `tier1_support` member (no siteAdmin) sees the GenieACS device-status panel on Tickets
