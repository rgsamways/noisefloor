## 1. API

- [x] 1.1 Add `CreateUserBody` zod schema (email, name, optional title, optional group with tier and rules) in `apps/api/src/routes/admin.ts`
- [x] 1.2 Add `POST /api/admin/users` behind `requireSiteAdmin`: lowercase the email, 409 on an existing account, create the user via Better Auth's internal adapter, return the same shape as the list endpoint
- [x] 1.3 Support the optional initial group: validate group and rule keys before creating the user, then insert the active membership
- [x] 1.4 Confirm no email is sent and no invitation row is created

## 2. Tests

- [x] 2.1 Route tests: create succeeds, duplicate email (including different case) returns 409, non-siteAdmin and unauthenticated are rejected, invalid body returns 400
- [x] 2.2 Route tests: initial group creates a membership with tier and rules; unknown group or invalid rule creates nothing
- [x] 2.3 Test that a created user signing in by magic link resolves to the existing account (no duplicate user)

## 3. Web

- [x] 3.1 Add a "Create user" form (email, name, title, optional group with tier) to `apps/web/src/pages/UsersAndGroups.tsx`; group rules are set afterward on the group screen
- [x] 3.2 Refresh the users list after creating, and show API errors (such as duplicate email) inline

## 4. Verification and close-out

- [x] 4.1 Manually verify in the browser: create a user, add them to a group, then sign in as them through a real magic link
- [x] 4.2 Run typecheck, lint, tests, and `openspec validate --all --strict`
- [x] 4.3 Archive the change, commit, and deploy (API via Railway, web via Vercel) before starting any other change
