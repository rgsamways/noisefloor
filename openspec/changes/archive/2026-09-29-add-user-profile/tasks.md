## 1. API

- [x] 1.1 Add `GET /api/admin/users/:id` behind `requireSiteAdmin`, returning name, title, email, emailVerified, siteAdmin, siteRules, and memberships (id, groupId, groupName, status, tier, rules); 404 for an unknown user

## 2. Tests

- [x] 2.1 Route tests: profile with two memberships including group names; revoked membership included; user with no memberships returns an empty list; 404 for an unknown user; unauthenticated and non-siteAdmin are rejected

## 3. Web

- [x] 3.1 Move the role display-name map from `AdminGroup.tsx` into a shared web module used by both pages
- [x] 3.2 Add `apps/web/src/pages/UserProfile.tsx` and its route in `App.tsx`: user info, group memberships with status, tier, rules, an exact-match role label, and a link to each group
- [x] 3.3 On the profile: name and title inputs with a Save button, the siteAdmin toggle, a Reports link, and Delete with confirm that returns to the list; show API errors inline
- [x] 3.4 Make the Users list read-only: name, title, and email link to the profile, siteAdmin is a read-only indicator, and in-place editing, the toggle, Reports, and Delete are removed from it

## 4. Verification and close-out

- [x] 4.1 Manually verify in the browser: open a profile from the list, edit name and title and save, see groups and rules, follow a group link, and confirm the list reflects the edit
- [x] 4.2 Run typecheck, lint, tests, and `openspec validate --all --strict`
- [x] 4.3 Archive the change, commit, and deploy (API via Railway, web via Vercel)
