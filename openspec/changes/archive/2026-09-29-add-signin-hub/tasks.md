## 1. Shared rule-rollup helper

- [x] 1.1 Add `getMyGroupRules(userId, isSiteAdmin)` to `apps/api/src/lib/group-authorization.ts` — union of `rules` from every `active` membership row for that user, or every catalog key if `isSiteAdmin` — and verify unit tests cover: multiple active memberships union without duplicates, a revoked membership's rules are excluded, and siteAdmin short-circuits regardless of memberships
- [x] 1.2 Add `requireGroupRule(rule)` to `apps/api/src/lib/group-authorization.ts` (or a new file alongside it) as a Fastify `preHandler` factory mirroring `requireSiteAdmin`'s shape (401 unauthenticated, 403 missing the rule, pass-through for siteAdmin or a holder), and verify a unit test covers all three outcomes

## 2. Extend the session endpoint

- [x] 2.1 Add `groupRules: string[]` to `GET /api/session`'s response in `apps/api/src/routes/session.ts`, computed via `getMyGroupRules`, and verify an integration test covers: a user with active memberships gets the union, a user with only a revoked membership gets none of that group's rules, siteAdmin gets every key

## 3. Gate EOD reports

- [x] 3.1 Apply `requireGroupRule("submit_eod_report")` to the filing/revising route in `apps/api/src/routes/eod-reports.ts`, and verify integration tests cover: a holder succeeds, a non-holder gets 403, siteAdmin succeeds without the rule
- [x] 3.2 Apply `requireGroupRule("view_own_eod_reports")` to the list-own and read-own-by-date routes, and verify integration tests cover the same three outcomes
- [x] 3.3 Verify existing eod-reports.test.ts tests that create a membership/session still pass, updating any that relied on the old requireSession-only behavior to grant the caller the needed rule first

## 4. Gate cases and attempts

- [x] 4.1 Apply `requireGroupRule("access_case_scenarios")` to all three routes in `apps/api/src/routes/cases.ts` (list, shell, stage), and verify integration tests cover: a holder succeeds, a non-holder gets 403, siteAdmin succeeds without the rule
- [x] 4.2 Apply `requireGroupRule("access_case_scenarios")` to all three routes in `apps/api/src/routes/attempts.ts` (create, commit, read), and verify the same three outcomes
- [x] 4.3 Verify existing cases.test.ts and attempts.test.ts tests still pass, updating any that relied on the old requireSession-only behavior to grant the caller the needed rule first

## 5. Split Admin.tsx into Users and Groups + Site Settings

- [x] 5.1 Create `apps/web/src/pages/UsersAndGroups.tsx` containing `Admin.tsx`'s existing `GroupsSection` and `UsersSection` unchanged, gated by the existing `RequireSiteAdmin`, and wire its route in `App.tsx`
- [x] 5.2 Create `apps/web/src/pages/SiteSettings.tsx` containing `Admin.tsx`'s existing `SettingsSection` unchanged, gated by the existing `RequireSiteAdmin`, and wire its route in `App.tsx`
- [x] 5.3 Delete `Admin.tsx` (superseded by the two new pages) and update any internal links (`AdminGroup.tsx`'s back-link, etc.) that pointed at the old `/admin` route
- [x] 5.4 Verify manually in the browser: sign in as siteAdmin, confirm both new pages render with their moved content and the old sections are gone — confirmed live via Playwright: `/admin/users-and-groups` renders Groups+Users, `/admin/settings` renders the EOD report format toggle; `Admin.tsx`/`/admin` no longer exist in the codebase or routes

## 6. Reports page

- [x] 6.1 Create `apps/web/src/pages/Reports.tsx` reusing `Me.tsx`'s existing EOD-report form/list content, wired to a new route, gated by `RequireAuth` (the page itself renders fine for any signed-in user; the underlying API calls enforce the real rule from section 3)
- [x] 6.2 Decide whether `/me` redirects to the new Reports route or is removed outright, and implement whichever is chosen (redirects — `<Navigate to="/reports" replace />`)
- [x] 6.3 Verify manually: a user holding `submit_eod_report`/`view_own_eod_reports` can file and read reports from the new page; a user without either rule gets a clear error from the form, not a silent failure

## 7. Tickets page shell

- [x] 7.1 Create `apps/web/src/pages/Tickets.tsx` as an empty shell gated by `RequireAuth` (its real content — the relocated GenieACS lookup — is implemented under `add-genieacs-device-status`'s own tasks), and wire its route in `App.tsx`

## 8. Hub page

- [x] 8.1 Add a `/hub` route to `apps/web/src/App.tsx`, gated by the existing `RequireAuth`, and change `SignIn.tsx`'s `callbackURL` from `/` to `/hub`
- [x] 8.2 Build the Hub page: fetch `GET /api/session` for `siteAdmin`/`groupRules`, and render a KB-page-styled card grid (matching `KbIndex.tsx`'s `grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3` card pattern) using the hardcoded `{card, requiredRule}` table from design.md: Users and Groups (`siteAdmin`), Site Settings (`siteAdmin`), Reports (`submit_eod_report` or `view_own_eod_reports`), Tickets (`view_device_status`)
- [x] 8.3 Implement the zero-memberships-and-not-siteAdmin state: no operational cards, only links to `/kb`, `/console`, `/roadmap`, `/about` — not named or coded as "visitor" anywhere, per design.md's decision
- [x] 8.4 Verify manually in the browser: sign in as siteAdmin and confirm all four cards show; as a non-admin with no memberships, confirm only the public-links state shows; give that account a membership with `submit_eod_report` and confirm the Reports card now appears after the next session refresh — confirmed live via Playwright: siteAdmin sees all cards (now 5, including the later-added Customers card); a fresh no-membership account sees only the public-links state; after granting a `tier1_support` membership (includes `submit_eod_report`) and reloading, both the Reports and Tickets cards appear

## 9. Full verification

- [x] 9.1 Run `pnpm test` and `pnpm typecheck` from the repo root and verify both pass with no regressions elsewhere
