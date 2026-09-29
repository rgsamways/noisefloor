## 1. Customer directory schema

- [x] 1.1 Add `customers` (id, name, contact fields) and `sites` (id, customerId FK, address/location fields) tables to `apps/api/src/db/schema.ts` (or a new schema file), generate the migration, and verify `pnpm --filter @noisefloor/api db:generate` produces a clean migration
- [x] 1.2 Add `device_tags` (id, siteId FK, externalSystem enum `"genieacs" | "uisp"`, externalDeviceId, unique constraint on `(externalSystem, externalDeviceId)`), and verify a unit/integration test confirms the unique constraint rejects re-tagging an already-tagged external device ID

## 2. UISP client

- [x] 2.1 Add `UISP_BASE_URL` and `UISP_API_TOKEN` to `apps/api/src/env.ts` (no default for the token), and add both to `.env.example` with a comment noting they're unset until a real UISP instance/token exists
- [x] 2.2 Add `apps/api/src/lib/uisp-client.ts`: `fetchUispDevice(deviceId)` calling `GET {UISP_BASE_URL}/nms/api/v2.1/devices/airmaxes/{id}` with the `x-auth-token` header, returning `null` on not-found and throwing `UispUnavailableError` on network/unreachable failures — mirroring `genieacs-client.ts`'s exact shape — and verify unit tests cover found/not-found/unreachable against a mocked fetch
- [x] 2.3 Implement the self-signed-cert-tolerant request using a per-request undici `Agent`/`dispatcher` (not the global `NODE_TLS_REJECT_UNAUTHORIZED` env var), and verify a unit test confirms the dispatcher option is actually passed to fetch (mocked, since there's no real cert to test against yet)
- [x] 2.4 Add `apps/api/src/lib/uisp-device-detail.ts`: a `toUispDeviceDetail()` pure function extracting identity/status/readings from a raw UISP `airMax` device response (signal, frequency, channel width, uptime, CPU/RAM) plus the raw record passthrough, mirroring `genieacs-device-detail.ts`, and verify unit tests cover a full record and a sparse one

## 3. UISP route

- [x] 3.1 Add `GET /api/uisp/devices/:deviceId`, gated by `requireGroupRule("view_device_status")` (reusing the existing rule, not a new one per design.md), and verify integration tests cover: a holder + online device, a holder + device not found (404), unreachable (502), a non-holder (403), siteAdmin bypass

## 4. Customer directory backend

- [x] 4.1 Add `POST /api/admin/customers` (create customer + at least one site) and `POST /api/admin/customers/:id/sites` (add another site), gated by `requireSiteAdmin`, and verify integration tests cover creation and the multi-site case
- [x] 4.2 Add `POST /api/admin/sites/:id/device-tags` (tag a `genieacs` or `uisp` device ID to a site), gated by `requireSiteAdmin`, rejecting a device ID already tagged elsewhere with a 409, and verify integration tests cover the happy path and the rejection
- [x] 4.3 Add a search endpoint (exact match only) accepting a single term and checking it against customer name, site address, and both `device_tags.externalDeviceId` columns, returning the matching customer or a clean no-match result, and verify integration tests cover: match by name, match by a tagged GenieACS device ID, match by a tagged UISP device ID, and no match

## 5. Customer directory admin UI

- [x] 5.1 Add a minimal admin page for creating a customer/site and tagging a device to it (exact location TBD — a placeholder location is fine, per design.md's Open Questions), and verify manually that a created customer/site/tag round-trips through the search endpoint from task 4.3 — page built at `/admin/customers` (linked from the Hub); manually verified end-to-end with a real headless-Chromium Playwright session driven against the running dev servers (real magic-link sign-in, siteAdmin grant, customer/site/device-tag creation, search-by-name and search-by-device-id both resolving to the new customer) — screenshots at `C:\tmp\snapshot-verify-screenshots\`

## 6. Search + snapshot on Tickets

- [x] 6.1 Add a search box to `Tickets.tsx` (alongside, not replacing, the existing raw-device-ID lookup) that calls the search endpoint and shows a clean no-match state or navigates to a snapshot view on a match — browser-verified: search by exact name, search by tagged device ID, and the no-match state all confirmed live via Playwright
- [x] 6.2 Add a customer snapshot screen showing the resolved customer's identity plus a card/section per tagged device, reusing the existing GenieACS `DeviceDetail.tsx` view for `genieacs`-tagged devices — extracted DeviceDetail.tsx's body into `GenieAcsDeviceCard.tsx` so both the standalone page and the snapshot screen render the identical component; snapshot data is handed to the screen via router state from the search result rather than a new by-id endpoint (no backend fetch specified by this task) — a hard refresh currently loses the snapshot, noted as a known limitation for future refinement, not silently dropped; browser-verified live
- [x] 6.3 Add a UISP device-detail screen (mirroring `DeviceDetail.tsx`'s structure) for `uisp`-tagged devices, rendered within the same snapshot screen — `UispDeviceCard.tsx`; wiring verified live (renders in the snapshot screen alongside GenieACS cards), not exercised against a real UISP device since none is tagged/available yet

## 7. Full verification

- [x] 7.1 Run `pnpm test` and `pnpm typecheck` from the repo root and verify both pass with no regressions elsewhere — 336 tests, typecheck, and lint all pass repo-wide; also added `fileParallelism: false` to `vitest.config.ts` (Robin approved) after discovering a pre-existing cross-file DB race that new test files made surface much more often
- [ ] 7.2 If a real UISP instance/token exists by the time this is implemented: verify manually against it, the same way the GenieACS bench trial was manually verified. If not yet available, explicitly leave this unchecked and note it as blocked on real credentials, rather than marking it done on mocked-only confidence.
