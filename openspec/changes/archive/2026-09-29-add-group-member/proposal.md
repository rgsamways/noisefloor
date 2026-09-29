## Why

The only way to put someone into a group today is the invite form, which is built around an email address and, for people who already have accounts, still sends them an email. Now that admins can create users directly, they need to add an existing user to a group from the group screen, with no invitation and no email.

## What Changes

- Add `POST /api/admin/groups/:groupId/memberships` (siteAdmin only): takes a `userId` and optional `rules`, and grants that user membership in the group. No email is sent.
- Adding a user whose membership was previously revoked reactivates it with the newly supplied rules. Adding a user who is already an active member returns 409.
- Add an "Add existing user" control to the group screen, beside the invite form: a picker of users not currently active in the group, with the same role-preset dropdown and rules checklist the invite form uses.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `admin-panel`: a siteAdmin can add an existing user directly to a group.

## Impact

- `apps/api/src/routes/admin.ts`: new route and body schema.
- `apps/web/src/pages/AdminGroup.tsx`: new add-member control.
- No schema migration: `group_memberships` already has every needed column.
- No change to the invite flow or to sign-in.
