## 1. Seed the entity

- [x] 1.1 Add a Drizzle migration inserting one `entities` row named "Northern Rural Networks", verified by `pnpm --filter @noisefloor/api db:generate`/`db:migrate` running cleanly locally and a quick `select` confirming exactly one row

## 2. Admin API routes

- [x] 2.1 Add `apps/api/src/routes/admin.ts`, registered in `app.ts`, with every route gated by `requireSiteAdmin` at the top of its handler (mirroring `requireSession`'s `if (!ok) return` shape): `GET /api/admin/groups` (with member counts), `POST /api/admin/groups` ({ name }, 409 on duplicate name), verified by tests covering both the list-with-counts shape and the duplicate-name conflict
- [x] 2.2 Add `GET /api/admin/groups/:groupId/members` (memberships joined with user name/email, plus pending invitations), verified by a test asserting the joined shape
- [x] 2.3 Add `POST /api/admin/groups/:groupId/invitations` ({ email, tier?, rules? }) — immediate membership if the email already has an account, else a pending invitation; 409 if that email already has a membership or pending invitation for this group; sends a notification via `send-invite-email.ts` either way, verified by tests covering both branches and the conflict case
- [x] 2.4 Add `DELETE /api/admin/groups/:groupId/invitations/:id` (404/400 if already accepted), verified by a test for both the success and already-accepted-rejection paths
- [x] 2.5 Add `PATCH /api/admin/groups/:groupId/memberships/:id` ({ tier?, rules? }, partial update, tier left alone if omitted) and `PATCH /api/admin/groups/:groupId/memberships/:id/revoke`, verified by tests covering a rules-only update leaving tier unchanged, and a revoke leaving the row queryable with status revoked
- [x] 2.6 Add `GET /api/admin/users` (name, email, siteAdmin, siteRules) and `PATCH /api/admin/users/:id` ({ siteAdmin?, siteRules? }), verified by a test confirming a granted siteAdmin is reflected in a subsequent `hasSiteRule`/`requireSiteAdmin` check
- [x] 2.7 Add `apps/api/src/lib/send-invite-email.ts` following `send-magic-link.ts`'s exact pattern (console-log fallback when `RESEND_API_KEY` is unset, direct Resend POST otherwise), verified by a test asserting the console-log fallback fires in the test environment (no `RESEND_API_KEY` set)

## 3. Admin page

- [x] 3.1 Add `apps/web/src/components/RequireSiteAdmin.tsx` mirroring `RequireAuth.tsx` (checks `session?.user.siteAdmin`, redirects non-admins to `/`), and wire `/admin` into `App.tsx` behind it
- [x] 3.2 Add the admin page (groups list + create-group form) using `HudPageShell`, calling the group routes via `apiFetch`
- [x] 3.3 Add the per-group member view (table: name, email, tier, rules, status; invite/edit/revoke actions; pending invitations with a cancel action)
- [x] 3.4 Add the users table (name, email, siteAdmin, siteRules) with inline editing for siteAdmin/siteRules

## 4. Spec conformance

- [x] 4.1 Run `openspec validate --change add-admin-panel --strict` and resolve any reported issues
- [x] 4.2 Confirm every scenario in `specs/admin-panel/spec.md` has a corresponding passing test or manually-verified behavior from tasks 1-3
