## Why

Every signed-in user currently lands back on the public Landing page after clicking their magic-link — noisefloor has no post-sign-in destination at all. Now that real group-scoped rules exist (`add-role-rules-catalog`), there's enough to route someone somewhere meaningful: a hub of the sections their rules actually unlock, instead of a fixed redirect that doesn't know who they are.

## What Changes

- Extend the existing `GET /api/session` (`apps/api/src/routes/session.ts`) to also return `groupRules`: the union of `rules` across the caller's active group memberships. It already returns `siteAdmin`/`siteRules` through the authoritative, post-invitation-processing `getSession` path — this adds the missing piece rather than standing up a second endpoint that would duplicate it.
- Add a new Hub page, styled like the existing KB page's card grid, as the new post-sign-in destination (`SignIn.tsx`'s `callbackURL` moves from `/` to `/hub`). Three states: no active memberships and not `siteAdmin` → no operational cards, just links to already-public content (KB, Console, Roadmap, About); holds at least one relevant rule → a card per unlocked section; `siteAdmin` → every card.
- Split the current `Admin.tsx` (today a single page cramming a settings toggle, groups, users, and the GenieACS panel together) into two pages, both still `siteAdmin`-only: **Users and Groups** (unchanged content — groups, invites, members, user list) and **Site Settings** (unchanged content — the EOD report mode toggle).
- Add a **Reports** page/route consolidating EOD reports (currently split between the personal `/me` page and an admin settings toggle) under one rule-gated area — `submit_eod_report` to file/revise, `view_own_eod_reports` to list/read your own — reachable by T1/T2 support, not just `siteAdmin`.
- Add a **Tickets** page/route. Its actual content is the GenieACS device-status lookup relocated out of Admin (see `add-genieacs-device-status`'s own revision) — checking/rebooting a device is a ticket-handling action, not an admin-only tool. No real ticket CRUD yet; this page exists so that work has somewhere to land later without moving again.
- The Hub's four cards — Users and Groups, Site Settings, Reports, Tickets — are shown or hidden per the caller's own `siteAdmin`/`groupRules`, matching whichever real gate each page's underlying route enforces (the hub never shows a card leading to a 403).
- **BREAKING**: tighten `apps/api/src/routes/eod-reports.ts` — filing/revising a report now requires the `submit_eod_report` rule, listing/reading your own reports now requires `view_own_eod_reports`. Previously any signed-in user could use these routes regardless of group membership.
- **BREAKING**: tighten `apps/api/src/routes/cases.ts` and `attempts.ts` — now require the `access_case_scenarios` rule (added to the catalog in `add-role-rules-catalog`). Previously any signed-in user could reach `/cases` and play a case. This explicitly resumes touching the parked case-study product, at the user's direction, solely to gate it consistently with everything else the hub shows — no other change to that product. The Cases feature does not get its own hub card in this change — no role grants `access_case_scenarios` by default, so it would never show one yet regardless.
- `siteAdmin` always bypasses every rule check above via the existing `hasGroupRule`/`getMyGroupRules` exemption, so tightening only narrows access for non-admin accounts.

## Capabilities

### New Capabilities
- `signin-hub`: the extended `GET /api/session` response and the post-sign-in hub page's card-visibility behavior.

### Modified Capabilities
- `eod-reports`: filing, revising, listing, and reading your own reports now require holding the matching rule, not just being signed in.
- `case-player-api`: reaching the case list, a case shell, stage content, or starting/committing an attempt now requires holding `access_case_scenarios`, not just being signed in.

## Impact

- Affected code: `apps/api/src/routes/eod-reports.ts`, `apps/api/src/routes/cases.ts`, `apps/api/src/routes/attempts.ts`, `apps/api/src/routes/session.ts`, `apps/api/src/lib/group-authorization.ts` (new `getMyGroupRules`/`requireGroupRule`), `apps/web/src/pages/SignIn.tsx`, `apps/web/src/pages/Admin.tsx` (split), new Hub/Reports/Tickets pages, `apps/web/src/App.tsx` (new routes). The Tickets page's GenieACS content itself is implemented under `add-genieacs-device-status`'s own revised tasks, not here.
- No database schema changes.
- Any existing non-siteAdmin account that currently uses EOD reports or cases without a matching group membership loses access until given one — a real, intentional narrowing, not an oversight.
