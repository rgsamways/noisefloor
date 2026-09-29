## Why

The only way to get a new person into noisefloor today is to invite their email to a group, which sends an email and leaves them as a pending invitation until they sign in. An admin has no way to simply create a user profile and save it, the way nearly every other application works. Admins need to create accounts directly, decide when and whether the person is told, and optionally place them in a group in the same step.

## What Changes

- Add `POST /api/admin/users` (siteAdmin only): creates a user row from email, name, and optional title. No email is sent and no invitation is created. The row starts with `emailVerified = false`.
- Reject an email that already has an account with 409 (case-insensitive match).
- Optionally accept an initial group with tier and rules, creating the group membership directly in the same request.
- Add a "Create user" form to the existing users list on `/admin/users-and-groups`.
- Sign-in stays magic-link only. The new user signs in whenever they choose by requesting a link for their email; the existing magic-link flow matches the existing user row rather than creating a new one. **No passwords** (explicit decision).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `admin-panel`: a siteAdmin can create a user account directly, optionally with an initial group membership.

## Impact

- `apps/api/src/routes/admin.ts`: new route and body schema.
- `apps/web/src/pages/UsersAndGroups.tsx`: new create form.
- No schema migration: the `user` table already holds every needed column.
- No change to `auth.ts` or the magic-link flow.
