## 1. Schema

- [x] 1.1 Add a Drizzle migration adding a nullable `title` text column to `user`, verified by `pnpm --filter @noisefloor/api db:generate`/`db:migrate` running cleanly locally

## 2. Admin API routes

- [x] 2.1 Add a `wouldRemoveLastSiteAdmin(excludingUserId)` helper in `admin.ts` (counts users with `siteAdmin: true` excluding the given id, returns true if zero), verified by tests covering both the "another siteAdmin exists" and "this is the last one" cases via the PATCH route below
- [x] 2.2 Extend `UpdateUserBody`/`PATCH /api/admin/users/:id` with optional `name`/`title` string fields, and call the guardrail before applying `siteAdmin: false`, rejecting with 409 if it would remove the last siteAdmin, verified by tests covering a successful name/title update and the last-siteAdmin rejection
- [x] 2.3 Extend `GET /api/admin/users` to include `title`
- [x] 2.4 Add `DELETE /api/admin/users/:id`: reject with 409 if `:id` matches the requesting session's own user id; otherwise delete the row and return 204. (No last-siteAdmin check here — design.md's Decision 1 found it unreachable given the self-delete block, so it's PATCH-only.) Verified by tests covering a successful delete (asserting sessions/memberships are gone via cascade) and the self-delete rejection

## 3. Admin page

- [x] 3.1 Add inline `name`/`title` text inputs to each row in `Admin.tsx`'s Users table, saved on blur via `apiFetch`. Deliberately does *not* reapply the PATCH response into local state on success (only on failure, via `reload()`) — doing so raced against editing a second field on the same row before the first field's response landed, stomping it back to a stale value. Also deliberately does not disable the row's inputs while a save is in-flight, for the same reason: disabling the sibling field mid-edit blocked/dropped the next keystroke in real testing.
- [x] 3.2 Add a delete button per row, gated by `window.confirm` naming the user's email, calling the new DELETE route and reloading the list on both success and failure

## 4. Spec conformance

- [x] 4.1 Run `openspec validate manage-user-accounts --strict` and resolve any reported issues
- [x] 4.2 Confirm every scenario in `specs/admin-panel/spec.md`'s MODIFIED requirements has a corresponding passing test or manually-verified behavior from tasks 1-3 — backend covered by `admin.test.ts` (19 tests passing); the two field-clobbering races above were found and fixed via a real-browser Playwright run (temporary spec, removed after verifying), not by the vitest suite alone
