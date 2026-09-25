## 1. Schema

- [x] 1.1 Add `eodReports` to `apps/api/src/db/schema.ts`: `id` (uuid pk), `userId` (text, no FK — design.md's Decision 1), `userEmail` (text, snapshot at write time), `reportDate` (date, mode "string"), `tickets`/`devicesRefurbished`/`packages`/`calls`/`other` (text, default ""), `createdAt`/`updatedAt` (timestamp), unique index on `(userId, reportDate)`
- [x] 1.2 Generate and run the migration, verified by `pnpm --filter @noisefloor/api db:generate`/`db:migrate` running cleanly locally

## 2. Self-service API routes

- [x] 2.1 Add `apps/api/src/routes/eod-reports.ts`, registered in `app.ts`. `GET /api/eod-reports` (session-gated via `requireSession`, matching `attempts.ts`'s style): list the caller's own reports (date + all fields), ordered by date descending, verified by a test asserting another user's report is never included
- [x] 2.2 `GET /api/eod-reports/:date`: the caller's own report for that date, 404 if none, verified by tests for both the found and not-found cases
- [x] 2.3 `PUT /api/eod-reports/:date`: upsert (create if missing, full-replace fields if it exists) the caller's own report for that date, snapshotting `userEmail` from the current session on every write, verified by tests covering create, re-save/replace (not a second row), and the `userEmail` snapshot being present

## 3. Admin API route

- [x] 3.1 Add `GET /api/admin/eod-reports/:userId` to `apps/api/src/routes/admin.ts` (siteAdmin-gated): that user's reports, date + all fields, verified by tests covering a successful siteAdmin read and a 403 for a non-siteAdmin caller

## 4. `/me` page

- [x] 4.1 Rework `apps/web/src/pages/Me.tsx`: keep the signed-in-as/sign-out header, add a report form (native date input defaulting to today, the five text fields, one Save button submitting all fields via `PUT`), loading the selected date's existing report via `GET` on date change. Moved to `HudPageShell`/`HudFloorNav` mid-implementation per design.md's revised Decision 3 (was originally planned as the light `PageShell`)
- [x] 4.2 Add a short list of the caller's recently filed dates (via `GET /api/eod-reports`) below the form; clicking one sets the date picker to it and loads that report for editing
- [x] 4.3 Add a static "Tickets" placeholder card explaining it's not live yet (proposal.md's explicit scope note), pointing back at the report form's `tickets` field as where to note ticket work for now
- [x] 4.4 (Added mid-implementation) Remove the now-redundant "Me" item from `BottomNav.tsx` — `/me` is reachable from Landing's "Welcome" link — and fix stale comments in `BottomNav.tsx`, `HudFloorNav.tsx`, and `PageShell.tsx` that described `/me` as light-themed

## 5. Admin viewer

- [x] 5.1 Add a "Reports" link per row in `Admin.tsx`'s Users table, to `/admin/users/:userId/reports`
- [x] 5.2 Add `apps/web/src/pages/AdminUserReports.tsx` (HudPageShell, per design.md's Decision 3): read-only list of that user's filed reports (date + all five fields), calling the new admin route; wire the route into `App.tsx` behind the existing `RequireSiteAdmin` guard

## 6. Spec conformance

- [x] 6.1 Run `openspec validate add-eod-reports --strict` and resolve any reported issues
- [x] 6.2 Confirm every scenario in `specs/eod-reports/spec.md` has a corresponding passing test or manually-verified behavior from tasks 1-5, including a real-browser check of the report form and admin viewer — backend covered by `eod-reports.test.ts` + `admin.test.ts` additions (242 tests passing across the suite); real-browser Playwright run (temporary spec, removed after) verified filing a report, date-switching load/clear behavior, the recent-reports list, the admin viewer showing the same data, and the "Me" nav item's removal
