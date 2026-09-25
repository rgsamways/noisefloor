## Why

Every support technician at Northern Rural Networks has to file a summary of a day's work — tickets touched, devices refurbished, packages mailed/accepted, calls made to customers. `/me` today is just "signed in as X, sign out" (`apps/web/src/pages/Me.tsx`); there's nowhere to put this. Robin also wants a ticket list/history on the same page eventually, but that depends on a capability that doesn't exist yet — noisefloor actually connecting to real customer radios — so for now it's a placeholder, not a real feature.

## What Changes

- Add an `eod_reports` table: one row per technician per calendar day, with five freeform text fields (`tickets`, `devicesRefurbished`, `packages`, `calls`, `other`) — matching Robin's own list plus one open-ended catch-all. Not FK'd to `user` (deliberately — see design.md's Decision 1, which directly follows from the forward-looking note already logged in `manage-user-accounts`'s proposal about historical data outliving a deleted account).
- Add self-service routes: list your own filed reports, get a specific date's report, and save (full-replace) a specific date's report. Session-gated, always scoped to the caller's own `userId` — there's no route that takes a `userId` param on the self-service side.
- Add one siteAdmin-only route to list another user's filed reports (Robin's own choice: report visibility is siteAdmin-only, not a new delegable rule, for now).
- Rework `/me`: a form (date picker + the five fields + Save) for today's (or any past) report, a short list of recently filed dates to reopen, and a static "Tickets" placeholder card explaining why it's empty today.
- Add a read-only admin view of another user's filed reports, reachable via a new "Reports" link on each row of the existing Users table in `/admin` (`Admin.tsx`).
- **BREAKING**: none — new table, new routes, new UI; nothing existing changes behavior.

## Capabilities

### New Capabilities
- `eod-reports`: the end-of-day report data model, self-service routes, siteAdmin-read route, `/me` form, and the admin read-only viewer.

### Modified Capabilities
(none — the admin panel's own requirements are unchanged; this only adds a new link into it, per `admin-panel`'s own design.md precedent of "the natural point to extend" rather than a spec change)

## Impact

- **Affected code**: one migration (`eod_reports` table), `apps/api/src/db/schema.ts`, `apps/api/src/routes/eod-reports.ts` (new), `apps/web/src/pages/Me.tsx` (reworked, moved to `HudPageShell` per design.md's revised Decision 3), `apps/web/src/pages/Admin.tsx` (new per-row link), `apps/web/src/pages/AdminUserReports.tsx` (new), `apps/web/src/App.tsx` (new route), `apps/web/src/components/BottomNav.tsx` (dropped the "Me" item — reachable via Landing's Welcome link instead).
- **Not affected**: `entity-group-permissions`, `admin-panel`'s existing routes, the case/attempt/gotcha system.
- **Explicitly out of scope**: real ticketing, or anything that generates an `eod_reports` entry automatically from `/console` — both depend on capabilities (customer radio connectivity; a live-vs-practice console session concept) that don't exist yet. `/me`'s "Tickets" section is a static placeholder, not wired to anything.
