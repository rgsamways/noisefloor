## Why

`add-admin-panel` deliberately scoped "removing a user" to revoking group memberships, not deleting an account, because there was no account-deletion capability anywhere in the app (that change's design.md, Non-Goals). Robin now needs an actual way to remove a person's account entirely — a revoked membership still leaves the account and its permissions sitting in the users table forever, with no way to clean it up. Building this also exposed two more gaps in the same screen: nothing stops a siteAdmin from removing the last siteAdmin (locking everyone out of `/admin`), and every user's `name` in the admin Users table is blank — magic-link sign-in never collects one, so there's no way to tell people apart beyond their email.

## What Changes

- Add `DELETE /api/admin/users/:id`, a hard delete relying on the existing `onDelete: cascade` foreign keys (`session`, `account`, `group_memberships` all cascade off `user.id` already). `group_invitations` has no FK to `user` (it's email-based, per its own schema comment), so a deleted user's past invitations are simply left as historical rows — nothing to clean up there.
- Add a guardrail shared by this new delete route and the existing `PATCH /api/admin/users/:id` siteAdmin-toggle route: reject an action that would leave zero users with `siteAdmin` true.
- Block a siteAdmin from deleting their own account (distinct from the last-siteAdmin guardrail above — this applies even when other siteAdmins exist).
- Add a `title` column to `user` (nullable text) and make both `name` and `title` admin-editable via `PATCH /api/admin/users/:id`, alongside the existing `siteAdmin`/`siteRules` fields. `name` already exists in the schema but is never populated by magic-link sign-in (confirmed: every user in production has `name: ''`), so there's currently no way for anyone, admin or otherwise, to put a real name on an account.
- Add a delete button (with a native `window.confirm` guard, per Decision 3) and inline name/title editing to the admin Users table in `apps/web/src/pages/Admin.tsx`.
- **BREAKING**: none — new route, new nullable column, additive fields on an existing route.

## Capabilities

### Modified Capabilities
- `admin-panel`: extends the existing "siteAdmin can list users and manage site-wide permissions" requirement with delete, name/title editing, and the two guardrails above.

## Impact

- **Affected code**: one migration (`title` column), `apps/api/src/routes/admin.ts` (new DELETE route, extended PATCH body/guardrail), `apps/api/src/routes/admin.test.ts`, `apps/web/src/pages/Admin.tsx`.
- **Not affected**: `entity-group-permissions`'s schema, group/membership/invitation routes, magic-link sign-in.
- **Explicitly out of scope**: any handling for future historical data (e.g. ticketing history) referencing a deleted user — per Robin's own framing, this is a forward-looking note for whenever that feature is designed, not a requirement to build against today, since nothing like it exists yet.
