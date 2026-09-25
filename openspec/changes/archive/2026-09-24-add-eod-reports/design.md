## Context

See proposal.md for motivation. Grounded in what's actually there today:

- `apps/api/src/db/schema.ts` holds the app-domain tables not related to auth or permissions (`attempts`, `stageCommits`, `gotchaProgress`) — the natural home for `eod_reports`, not `auth-schema.ts` or `permissions-schema.ts`.
- `apps/api/src/db/permissions-schema.ts`'s own `groupInvitations` already has precedent for a user-referencing table with *no* FK to `user`: "the inviter may not exist by the time this is read back (deleted account, etc.) — same reasoning as kerfy's own invitations."
- `manage-user-accounts` (this session, just shipped) added a hard `DELETE /api/admin/users/:id` that cascades to every FK'd table. Its own proposal.md explicitly scoped this: "Explicitly out of scope: any handling for future historical data (e.g. ticketing history) referencing a deleted user... a forward-looking note for whenever that feature is designed, not a requirement to build against today, since nothing like it exists yet." `eod_reports` is that historical data, arriving now.
- `apps/api/src/lib/get-session.ts` exports both `getSession` (returns `null`, used by `requireSiteAdmin`) and `requireSession(request, reply)` (replies 401 itself and returns `null`, used directly in route handlers like `attempts.ts`) — `eod-reports.ts`'s self-service routes should use `requireSession` to match `attempts.ts`'s own style.
- `apps/web/src/pages/Me.tsx` uses the light `PageShell`, not `HudPageShell` — confirmed still the only page using it this way; the admin-panel's own design.md called `/me` "your own progress, a reading experience," which is exactly this feature's framing too.
- No existing route reads a `date`-typed Postgres column anywhere in this codebase — `attempts`/`stageCommits`/`gotchaProgress` all use `timestamp`. This is the first `date`-typed column.

## Goals / Non-Goals

**Goals:**
- Let a technician file and revisit their own daily report, one row per calendar day.
- Let a siteAdmin read another technician's filed reports (Robin's explicit choice: siteAdmin-only, not a new delegable rule, for now).
- Put a placeholder where the future ticket list will live, so `/me` doesn't look unfinished, without building anything ticketing depends on.

**Non-Goals:**
- Real ticketing, or anything that reads `/console` state. Both explicitly deferred (proposal.md).
- A new `siteRules` entry (e.g. `view_reports`) for delegated report visibility. Robin's own choice was siteAdmin-only for now; add the rule later if a non-siteAdmin manager role is ever needed (mirrors `manage_kb_content`'s own shape if that day comes).
- Per-field autosave on the report form. `manage-user-accounts` shipped this exact pattern for `Admin.tsx`'s Users table and hit a real race (a field's save-response landing mid-edit on a sibling field clobbered it) — worked around there by never reapplying a success response into state. A five-field daily report is better served by one explicit "Save" action over the whole form; there's no reason to reintroduce that class of bug for a feature that doesn't need autosave at all.
- Blocking future-dated reports. The client only ever offers a browser-local date picker defaulting to today; validating "not in the future" server-side would need a notion of the user's timezone that doesn't exist anywhere in this app, for a case (someone manually picks tomorrow's date) that's harmless if it happens.

## Decisions

**1. `eod_reports.user_id` is a plain `text` column with no foreign key to `user`, and deleting a user does not delete their reports.** This directly satisfies the forward-looking note already logged in `manage-user-accounts`: a technician's filed history is exactly the kind of "historical data" that shouldn't disappear just because their account was later removed. Follows `group_invitations`' own precedent in this same codebase for a user-referencing column with no FK. To keep old reports readable after the account is gone, the report also stores `userEmail` (captured at write time, never updated) — the account's `name`/`email` can change or vanish; the report's own snapshot doesn't.
*Alternative considered:* keep the FK with `onDelete: cascade`, matching every other user-referencing table. Rejected — this is precisely the case Robin already called out by name when scoping hard delete; building it to cascade anyway would contradict a decision he's already made, not just an oversight to fix later.
*Alternative considered:* `onDelete: "set null"`. Rejected — `user_id` is part of the report's own unique constraint (one report per user per day) and its own identity; a nulled-out `user_id` loses the ability to distinguish whose history this was without the `userEmail` snapshot doing all the work anyway, so there's nothing gained over simply not having the FK.

**2. The report form saves all five fields together via one `PUT`, not per-field like `Admin.tsx`'s Users table.** See Non-Goals — per-field autosave is the exact pattern that just produced a real bug elsewhere in this codebase this session. A daily report is naturally "fill in what happened, then save," not a live-edited record; one save action avoids the whole class of problem outright rather than re-solving it.

**3. `/me` moves to `HudPageShell`, superseding this design's original plan to keep it on the light `PageShell`.** Revised mid-implementation on Robin's explicit instruction: bring `/me` visually in line with the rest of the site rather than leave it on the shell everything else has already moved off of. By this point `HudPageShell` was already the site-wide norm (About, Admin, Console, Contact, KB, Landing, Roadmap all use it) — light `PageShell` was down to `/me`, `/cases`, and the case player, i.e. the exception, not the rule `admin-panel`'s design.md was describing when this decision was first written. The admin viewer page still uses `HudPageShell` too, for the original reason: it's an operator tool in the same category as `/admin` itself. Follow-on cleanup done in the same pass: removed the now-redundant "Me" item from `BottomNav.tsx` (kept for `/cases`/the case player, which haven't moved yet) since `/me` is reachable from the Landing page's "Welcome" link instead, and corrected stale comments in `BottomNav.tsx`, `HudFloorNav.tsx`, and `PageShell.tsx` that still described `/me` as light-themed.

**4. The admin viewer is a new page (`/admin/users/:userId/reports`) linked from a "Reports" button per row in the existing Users table, not a modal or an inline expansion.** Matches the existing pattern of `/admin/groups/:groupId` as a drill-down page from `/admin`'s own group list — this codebase already has that navigation shape once; a report history (potentially many dated entries) is exactly the kind of content that belongs on its own page, not squeezed into a table row.

**5. `reportDate` is a Postgres `date` column (`mode: "string"`), not a `timestamp`.** A report is inherently "which calendar day," not a point in time — using `timestamp` would invite timezone bugs when comparing dates (e.g. "did they already file today's report") that a plain date column sidesteps entirely. `mode: "string"` keeps route params (`YYYY-MM-DD`) passing straight through without a Date-object round trip.

## Risks / Trade-offs

- **[Risk]** No FK means a stale/deleted `userId` in an old report can't be joined back to a live `user` row (Decision 1). → **Mitigation**: acceptable and intentional — the `userEmail` snapshot is exactly the fallback for "who was this," and this only matters for a technician who has since left, which is the case this design is explicitly protecting for.
- **[Risk]** Without a `siteRules`-based delegation, only siteAdmins (today: just Robin) can review anyone's reports. → **Mitigation**: acceptable per Robin's own explicit choice; revisit if NRN grows a manager role that isn't full siteAdmin.

## Migration Plan

One new Drizzle migration: create `eod_reports`. No changes to existing tables. Land order: migration + API routes first (verifiable via tests without any UI), then `/me` and the admin viewer — same "backend then frontend" order every prior change in this repo has used.
