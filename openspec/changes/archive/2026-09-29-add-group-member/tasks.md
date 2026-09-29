## 1. API

- [x] 1.1 Add an `AddMemberBody` zod schema (`userId`, optional `rules`) in `apps/api/src/routes/admin.ts`
- [x] 1.2 Add `POST /api/admin/groups/:groupId/memberships` behind `requireSiteAdmin`: 404 for an unknown group or user, 409 for an active member, reactivate a revoked one with the new rules, otherwise insert; no email and no invitation

## 2. Tests

- [x] 2.1 Route tests: adds a non-member with rules; reactivates a revoked member with replaced rules and no duplicate row; 409 for an active member; 404 for an unknown group and for an unknown user; invalid rule key returns 400; unauthenticated and non-siteAdmin are rejected
- [x] 2.2 Test that no invitation row is created

## 3. Web

- [x] 3.1 Add an "Add existing user" control to `apps/web/src/pages/AdminGroup.tsx`: a picker of users not currently active in the group, the role-preset dropdown, and the rules checklist
- [x] 3.2 Reload the members list after adding and show API errors inline

## 4. Verification and close-out

- [x] 4.1 Manually verify in the browser: add a user, revoke them, add them again and confirm they return active with the new rules
- [x] 4.2 Run typecheck, lint, tests, and `openspec validate --all --strict`
- [x] 4.3 Archive the change, commit, and deploy (API via Railway, web via Vercel) before starting any other change
