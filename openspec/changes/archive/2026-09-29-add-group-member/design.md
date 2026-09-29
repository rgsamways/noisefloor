## Context

Membership is a `group_memberships` row unique on `(userId, groupId)`, with `tier`, `rules`, and a `status` of active or revoked. Revoking flips the status and keeps the row. Access today is granted only by the invite route, which creates a membership immediately for an existing user but sends an email. The group screen already has a role-preset dropdown and a rules checklist for invitations, and the users list is available from `GET /api/admin/users`.

## Goals / Non-Goals

**Goals:**
- Add an existing user to the group from the group screen, silently.
- Handle a revoked membership without forcing the admin to un-revoke by hand.

**Non-Goals:**
- Tier: it stays null and hidden, as on the invite form.
- Changing the invite flow, or adding users to several groups at once.
- The user profile page (a separate change).

## Decisions

### Decision 1: Reactivate on re-add

The unique index means a second insert for a revoked membership would fail. The route looks the membership up first: none means insert; revoked means update to active with the supplied rules; active means 409. Reactivation replaces the old rules with the supplied ones rather than merging, so what the admin selects is exactly what the user gets.

### Decision 2: Reuse existing pieces

The route takes `userId`, not an email, and validates rule keys with the same `groupRuleKeySchema` the invite route uses. The UI candidate list is `GET /api/admin/users` filtered client-side against the active members already loaded by the screen, so no new list endpoint is needed. The role dropdown and rules checklist are the same components as the invite form.

### Decision 3: Pending invitations are left alone

If a pending invitation exists for the same email, it stays. On that person's next sign-in, the existing conversion code finds the membership already present, skips the insert, and marks the invitation accepted, so there is no conflict.

## Risks / Trade-offs

- Reactivating with replaced rules discards the old rule set. Accepted: a revoked membership's rules are stale by definition, and the admin sees and sets the new ones.
