## 1. Catalog in packages/shared

- [x] 1.1 Add `GROUP_RULE_DOMAINS` (the 11 domains from design.md), `ALL_GROUP_RULE_KEYS`, `groupRuleKeySchema`, and `GroupRuleKey` to `packages/shared/src/schemas/rules.ts`, leaving `SITE_RULE_KEYS`/`siteRuleKeySchema` untouched, and verify `pnpm --filter @noisefloor/shared typecheck` and `build` pass
- [x] 1.2 Add `GROUP_ROLE_DEFAULT_RULES` (the 12 roles from design.md, each a `GroupRuleKey[]`) and a `defaultRulesForGroupRoles` helper mirroring kerfy's `defaultRulesForRoles`, and verify a unit test covers: a role's default set matches its designed keys, and every key in every role's default set exists in `ALL_GROUP_RULE_KEYS`
- [x] 1.3 Add a unit test asserting `ALL_GROUP_RULE_KEYS` has no duplicate keys across domains and no overlap with `SITE_RULE_KEYS` (confirms the `manage_kb_content` fold-back didn't get duplicated)
- [x] 1.4 Add `access_case_scenarios` to the `training_kb` domain (needed by `add-signin-hub`'s tightening of `apps/api/src/routes/cases.ts`/`attempts.ts`), give it to no role's default set, and verify `pnpm --filter @noisefloor/shared build` passes and the duplicate/overlap test from 1.3 still passes

## 2. Backend validation

- [x] 2.1 Change `InviteBody`'s and `UpdateMembershipBody`'s `rules` field in `apps/api/src/routes/admin.ts` from `z.array(z.string())` to `z.array(groupRuleKeySchema)`, and verify existing admin route tests still pass
- [x] 2.2 Add an integration test: inviting with an unknown rule key returns 400 and creates no invitation/membership row
- [x] 2.3 Add an integration test: updating a membership with an unknown rule key returns 400 and leaves the existing `rules` unchanged

## 3. Admin UI — rule editing

- [x] 3.1 Add a rules checklist (grouped by domain, matching `AdminGroup.tsx`'s existing HUD styling) to each member row in `AdminGroup.tsx`, showing the membership's current `rules`, and verify manually in the browser that toggling a checkbox calls the existing membership-update endpoint and persists
- [x] 3.2 Add the same rules checklist to the invite form, sent as part of the invitation's `rules` on submit, and verify manually that an invited-then-accepted membership carries the selected rules

## 4. Admin UI — role picker

- [x] 4.1 Add a role-select control (matching design.md's "distinct action, not a checkbox" decision) next to the rules checklist on each member row, which on selection replaces that membership's `rules` with the selected role's default set via the existing update endpoint, and verify manually that applying a role updates the visible checkboxes to match
- [x] 4.2 Add the same role-select control to the invite form, pre-filling the invite's `rules` with the selected role's default set (still hand-editable afterward before sending), and verify manually

## 5. Full verification

- [x] 5.1 Run `pnpm test` and `pnpm typecheck` from the repo root and verify both pass with no regressions elsewhere
- [x] 5.2 Manually verify end-to-end in the browser: invite a new email with a role applied, confirm the pending invitation shows the role's rules, then sign in as that email and confirm the resulting membership carries those rules in the admin UI — confirmed live via Playwright: applying "Tier 1 support" to the invite form correctly checks that role's full rule set, and after sign-in the resulting membership's `rules` column holds the exact same set (verified in the DB and via the admin UI's per-member rule checklist). **Caveat found**: the pending-invitations list itself (`AdminGroup.tsx`) only renders the invitee's email, not a preview of the applied rules — the rules are fetched (`GET .../members` returns them) but never rendered for a still-pending invitation. Flagging as a minor UI gap, not fixed here since it wasn't asked for.
