## 1. Schema

- [x] 1.1 Add `eodReportModeEnum` (`freeform` | `structured`) and an `eodReportMode` column (default `freeform`) to `entities` in `apps/api/src/db/permissions-schema.ts`
- [x] 1.2 Add a `mode` column (same enum, not null, default `freeform`) and four nullable `jsonb` columns (`ticketRows`, `deviceRows`, `packageRows`, `contactRows`) to `eodReports` in `apps/api/src/db/schema.ts`, leaving the five existing text columns untouched
- [x] 1.3 Generate and run the migration, verified by `pnpm --filter @noisefloor/api db:generate`/`db:migrate` running cleanly locally, and a quick check that every existing `eod_reports` row backfilled to `mode = 'freeform'`

## 2. Mode setting routes

- [x] 2.1 Add `GET /api/eod-report-mode` (session-gated via `requireSession`) in `eod-reports.ts`: returns the current site-wide mode, verified by a test
- [x] 2.2 Add `GET /api/admin/settings` and `PATCH /api/admin/settings` (siteAdmin-gated) in `admin.ts`, operating on the resolved entity row (mirrors `resolveEntityId()`'s existing pattern), verified by tests covering a successful read/update and a 403 for a non-siteAdmin caller

## 3. Self-service report routes

- [x] 3.1 Define the structured-mode Zod body schema (`ticketRows`/`deviceRows`/`packageRows`/`contactRows` arrays of their respective typed row shapes, plus `other`; `contactRows`' `method` field is a `z.enum(["phone", "email"])`), alongside the existing freeform `ReportBody`
- [x] 3.2 Update `PUT /api/eod-reports/:date`: look up any existing row for that date first; if one exists, validate against and save in *its* mode; if none exists, validate against and save in the site's *current* mode. Reject a body shape that doesn't match the mode being saved under. Verified by tests covering: new freeform save, new structured save, re-saving an existing freeform report after the site switched to structured (stays freeform), and a mismatched-shape rejection
- [x] 3.3 Update `GET /api/eod-reports` and `GET /api/eod-reports/:date` to include `mode` and whichever fields are populated for that mode

## 4. `/me` page

- [x] 4.1 Fetch the site's current mode alongside the existing report/recent-reports data
- [x] 4.2 Render the freeform textareas (current behavior) when the report being edited (existing or, for a new date, the site's current mode) is `freeform`
- [x] 4.3 Render an Excel-like table per structurable category when in `structured` mode: columns per proposal.md (Tickets: ticket number, customer, summary, status; Devices: device type, serial/ID, notes; Packages: direction, description, tracking #; Customer contacts: customer, method [Phone/Email selector], phone/email used, reason, outcome), each with an "Add row" button and a per-row remove control. `Other` stays a single textarea in both modes. The freeform label for this category also becomes "Customer contacts" (design.md's Decision 4a), even though its underlying field name stays `calls`. Fixed-choice fields (Status, Direction, Method) render as toggle-button groups, not native `<select>`s — same reasoning as `HudDatePicker`
- [x] 4.4 Save button submits whichever shape matches the mode currently being rendered
- [x] 4.5 (Found during real-browser testing) All report fields are disabled while the initial per-date fetch is loading — without this, typing into a field immediately after navigating to `/me` or switching dates could be silently wiped when that fetch resolved and reset local state. Same protection `Save` already had, extended to every input

## 5. Admin viewer and settings toggle

- [x] 5.1 Update `AdminUserReports.tsx` to render each report according to its own `mode` (freeform fields or the structured tables), since a siteAdmin may see both shapes across one user's history
- [x] 5.2 Add a "Report format" toggle (freeform/structured) to `/admin`, calling the new settings routes

## 6. Spec conformance

- [x] 6.1 Run `openspec validate add-eod-report-modes --strict` and resolve any reported issues
- [x] 6.2 Confirm every scenario in `specs/eod-reports/spec.md`'s MODIFIED/ADDED requirements has a corresponding passing test or manually-verified behavior, including a real-browser check: file a structured report, switch the site back to freeform, confirm the structured report still renders structured while a new one renders freeform — done via a temporary Playwright spec (removed after), which also caught the 4.5 race
