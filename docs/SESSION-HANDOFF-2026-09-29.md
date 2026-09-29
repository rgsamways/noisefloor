# Session handoff — 2026-09-29 (customer-snapshot shipped, 4 changes archived/committed/deployed in one batch)

**Status:** everything described below is committed, pushed to `main`, and deployed live (`api.noisefloor.ca` on Railway, `noisefloor.ca` on Vercel). Production Postgres has the new migration applied. Working tree is clean, nothing uncommitted. Read `/README.md` first for always-current orientation, then this doc for what happened and what's queued up next.

## What this session did

**1. Finished and shipped `add-customer-snapshot`** (started previous session, continued here from a blocked TypeScript error in `uisp-client.ts`). Built: `uisp-client.ts`/`uisp-device-detail.ts` (mirrors `genieacs-client.ts`'s shape, mock-tested, self-signed-cert-tolerant via a per-request undici `Agent`), `GET /api/uisp/devices/:deviceId`, a `customers`/`sites`/`device_tags` schema + migration, customer/site/device-tag CRUD + exact-match search (`GET /api/customers/search`), an admin UI at `/admin/customers`, and a customer search box + snapshot screen on `/tickets` (`CustomerSnapshot.tsx`) that renders every tagged device via `GenieAcsDeviceCard`/`UispDeviceCard` — both extracted from what was `DeviceDetail.tsx`'s whole page, so the exact same view is reused, not just linked to.

**2. Added a `GET /api/admin/customers` list endpoint beyond the original task list**, flagged at the time — the admin UI had no way to browse existing customers to tag more devices without it (only create + exact-match search existed).

**3. Found and fixed a pre-existing cross-file DB test race**, made much worse by this session's new test files: several test helpers do an unordered `SELECT ... FROM entities LIMIT 1` while other test files insert-then-delete their own temporary entity rows, racing when run in parallel. Fixed with `fileParallelism: false` in root `vitest.config.ts` (Robin approved after being shown the nondeterministic failures) — test files now run sequentially against the shared dev Postgres instead of racing.

**4. Did real Playwright-driven manual verification**, not just claims — Robin explicitly pushed back once on an under-verified claim ("huh? cant use playwright?"), which led to actually discovering Playwright is available in this repo (`playwright@1.63.0` in the pnpm store, just not hoisted to top-level `node_modules`) and driving real headless-Chromium sessions against the live dev servers: real magic-link sign-in, a `psql` siteAdmin grant, real clicks/form-fills, screenshots. This covered not just `add-customer-snapshot`'s own tasks but retroactively closed out 4 manual-verification tasks that had been sitting unchecked from earlier sessions (`add-genieacs-device-status` 6.4, `add-role-rules-catalog` 5.2, `add-signin-hub` 5.4 and 8.4) — all confirmed live.

**5. Found one real UI gap while verifying, not fixed (wasn't asked for):** `AdminGroup.tsx`'s pending-invitations list only renders the invitee's email — the invitation's `rules` are fetched by the frontend (`GET .../members` returns them) but never rendered, even though applying a role does correctly pre-fill the invite form's checklist before sending.

**6. Archived all 4 open changes** (`add-genieacs-device-status`, `add-role-rules-catalog`, `add-signin-hub`, `add-customer-snapshot`), syncing each delta into `openspec/specs/`. `openspec validate --all --strict` passes clean (25/25 specs).

**7. Committed and pushed**: one comprehensive feature commit (65 files — the whole session's + prior session's accumulated GenieACS/roles/Hub/customer-snapshot work, since real interdependencies made a clean per-change split impractical to reconstruct after the fact) plus 4 separate "Archive X" commits, matching this repo's usual pattern for the archive step specifically.

**8. Deployed to production** — see "Operational facts" below for the exact mechanics, none of which were obvious going in.

**9. Robin flagged, after the fact, that batching all 4 changes' archive/commit/deploy into one end-of-session sweep wasn't his normal process** — his normal process is to close out each change (archive + commit + deploy) before starting the next. Saved as `feedback_archive_commit_per_proposal` memory. Apply this going forward.

## Operational facts that will bite you if forgotten

- **Neither Railway (`api`) nor Vercel (`web`) auto-deploys on `git push`.** Both need a manual CLI trigger every time: `railway up --service api --environment production` for the API; `vercel --prod --yes` for the web app.
- **`vercel --prod` must be run from the repo root, not `apps/web`.** The Vercel project's Root Directory setting (`apps/web`) is relative to a full-repo upload — running it from inside `apps/web` makes Vercel look for `apps/web/apps/web` and fails with "Root Directory does not exist."
- **Production Postgres has no public proxy.** To run a migration against it from a local machine: `railway connect Postgres --tunnel-only` opens an SSH tunnel and prints a local host/port/password; point `DATABASE_URL` at that local tunnel address for `pnpm --filter @noisefloor/api db:migrate`. Plain `railway run` won't work for this — it injects the *internal* `postgres.railway.internal` hostname, which only resolves inside Railway's own network, not from a local machine.
- **Vitest now runs test files sequentially** (`fileParallelism: false`, root `vitest.config.ts`) — a real fix for the cross-file DB race in #3 above, not a perf regression to casually "fix" by re-enabling parallelism.
- **Local dev's `apps/api/.env` has a real Resend API key**, not the "logs to console" dev-friendly default — Resend's sandbox rejects `@example.com` recipients with a 422. To get magic-link tokens printed to console for local testing/automation (e.g. driving sign-in via Playwright), temporarily comment out `RESEND_API_KEY` in `.env` and restart the dev server, then **restore it after** — don't leave it disabled.
- **GenieACS/UISP are both live in production code but functionally dead there.** No `GENIEACS_NBI_URL`/`UISP_BASE_URL`/`UISP_API_TOKEN` are set on Railway — GenieACS falls back to `localhost:7557` (meaningless off Robin's home LAN) and UISP throws a clean `UispNotConfiguredError`. This is expected, not a regression — both integrations are explicitly local/mock-tested only until real credentials/infra exist.
- **Playwright is available in this repo** (`playwright@1.63.0`, pinned via `pnpm`) even though there's no top-level `node_modules/playwright` — require it via its full pnpm-store path (`node_modules/.pnpm/playwright@1.63.0/node_modules/playwright`). Browser binaries live under `%LOCALAPPDATA%\ms-playwright\`; if the package's expected revision isn't downloaded, pin `executablePath` to whatever revision *is* present rather than triggering a fresh `npx playwright install`.

## What NOT to do without checking first

- **Don't start another openspec change without first archiving + committing (and deploying, if relevant) whatever was just finished.** This is Robin's explicit normal process, broken this session, and flagged as a mistake to avoid repeating — see `feedback_archive_commit_per_proposal` memory.
- **Don't assume NRN has a real UISP tenant or token.** Every UISP-related decision so far (API shape, hardware-family dispatch, self-signed-cert handling) comes from a separate personal project's (`C:\dev\meridian`) research, tested against a personal lab VM — never confirmed against NRN's actual live systems.
- **Don't build the pending-invitations rules-preview UI** (see #5 above) without checking if Robin actually wants it — flagged as a gap, not requested.
- **Don't treat `CustomerSnapshot.tsx` surviving a page refresh as a bug to quietly fix.** It's router-state-only right now (no by-id snapshot endpoint) — a known, accepted limitation for this first slice, not an oversight.

## Suggested next step

No open thread was left mid-design this time (unlike the 2026-09-24 handoff's fault-catalog thread) — ask Robin what's next. Natural candidates already parked/discussed, roughly in order of how concretely they've been scoped:

1. A by-id customer-snapshot endpoint, so the snapshot screen survives a refresh/deep-link instead of relying on router state.
2. Automating customer/device tagging at provisioning time instead of the current fully-manual `/admin/customers` UI.
3. Getting NRN's real UISP tenant URL/token and actually verifying the UISP client against it (currently mock-tested only, same as GenieACS was before its own bench-trial verification).
4. Fixing the pending-invitations rules-preview UI gap (#5 above).
5. Device-status history — explicitly parked as its own future design, needs its own architecture pass (see `project_noisefloor_hub_and_tickets_design` memory).

## Where everything lives

- Current direction: `/README.md`, `docs/NOISEFLOOR-CONSOLE-HANDOFF.md`
- This session's full narrative: memory `project_noisefloor_genieacs_bench_trial`, `project_noisefloor_hub_and_tickets_design`, `reference_uisp_api_details`
- The archive/commit-per-proposal preference: memory `feedback_archive_commit_per_proposal`
- Customer directory backend: `apps/api/src/routes/customers.ts`, `apps/api/src/db/customer-schema.ts`
- UISP client: `apps/api/src/lib/uisp-client.ts`, `uisp-device-detail.ts`, `apps/api/src/routes/uisp.ts`
- Snapshot UI: `apps/web/src/pages/CustomerSnapshot.tsx`, `Customers.tsx`, `apps/web/src/components/{GenieAcsDeviceCard,UispDeviceCard}.tsx`
- Archived changes from today: `openspec/changes/archive/2026-09-29-{add-genieacs-device-status,add-role-rules-catalog,add-signin-hub,add-customer-snapshot}/`
- Verification screenshots: `C:\tmp\snapshot-verify-screenshots\`, `C:\tmp\remaining-verify-screenshots\` (local machine only, not committed)
