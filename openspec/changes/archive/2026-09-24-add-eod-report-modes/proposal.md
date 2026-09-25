## Why

`add-eod-reports` shipped one freeform text field per category (tickets, devices refurbished, packages, calls, other), per an earlier explicit choice ("one freeform text block per category") over structured per-entry rows. Having used it, Robin's team actually tracks this in Excel today, and wants noisefloor's version to look more like that — structured rows per category, not one big paragraph per category. Robin also wants this to be a toggle, not a hard replacement: a siteAdmin-controlled setting that switches end-of-day reports between the current freeform shape and the new "excel-like" structured shape.

## What Changes

- Add an `eodReportMode` setting (`freeform` | `structured`), stored on `entities` (the one org-level singleton row this codebase already resolves for admin-panel routes — see design.md's Decision 1), defaulting to `freeform` so nothing changes for anyone until a siteAdmin flips it. Add a siteAdmin-only route to read/update it, and a session-gated route for any signed-in user to read the current mode.
- Add structured columns to `eod_reports` for the four structurable categories, each a JSON array of typed rows, alongside the existing freeform text columns (kept as-is, unchanged):
  - Tickets worked on: ticket number, customer, summary, status (Resolved / Follow-up needed)
  - Devices refurbished: device type, serial/ID, notes
  - Packages mailed/accepted: direction (Mailed / Accepted), description, tracking #
  - Customer contacts (renamed from "Calls made to customers" — broadened to any contact, not just phone, per Robin's own suggestion): customer, method (Phone / Email), phone/email used, reason, outcome
  - `other` stays freeform text in both modes — it's the explicit catch-all, not a structurable category.
- Stamp each saved report with the mode it was actually saved under (mirrors the existing `userEmail`-snapshot reasoning already in this table) — a report's own stored mode decides how it renders and how it's edited, not whatever the site's *current* setting happens to be by the time someone reopens it.
- Rework `/me`'s report form to render either the current freeform textareas or an Excel-like editable table (add row / remove row / per-cell inputs) per category, depending on the mode of the report being edited (the existing report's own mode if one exists for that date, otherwise the site's current mode for a brand-new entry).
- Rework the admin viewer (`AdminUserReports.tsx`) to render either shape per report, since a siteAdmin reviewing history will see both freeform and structured reports side by side once the switch has happened once.
- Add a "Report format" toggle to `/admin`.
- **BREAKING**: none — additive columns, existing freeform reports keep working exactly as filed; the default mode is unchanged from today's actual (if unlabeled) behavior.

## Capabilities

### Modified Capabilities
- `eod-reports`: filing/reading a report now depends on a mode, stored per-report and controlled by a site-wide siteAdmin setting.

## Impact

- **Affected code**: one migration (`entities.eod_report_mode`, new `eod_reports` columns), `apps/api/src/db/permissions-schema.ts`, `apps/api/src/db/schema.ts`, `apps/api/src/routes/eod-reports.ts`, `apps/api/src/routes/admin.ts`, `apps/web/src/pages/Me.tsx`, `apps/web/src/pages/AdminUserReports.tsx`, `apps/web/src/pages/Admin.tsx`.
- **Not affected**: every already-filed freeform report — read, unchanged, exactly as before.
- **Explicitly out of scope**: CSV export (raised in the same conversation as a related but separate idea, not yet greenlit for building); any bulk migration of old freeform reports into structured rows.
