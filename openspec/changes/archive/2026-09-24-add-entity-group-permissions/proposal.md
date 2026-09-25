## Why

Every signed-in user gets identical access today — `magic-link-auth` has no concept of roles, admin access, or organizational structure at all. Robin wants a real permission system: a superadmin ("god-user") for his own account, named entities (Northern Rural Networks) containing named groups (Support, Sales, Billing, Dispatch, etc.) that users get assigned to with individually-tunable permissions, plus site-wide permissions independent of any entity/group — the foundation an eventual admin screen, invite-sending flow, and a sign-in experience that differs for NRN staff versus the general public will all sit on top of.

This change builds the underlying data model and enforcement primitives only. The admin UI, invite-sending UI, and differentiated public/staff experience are deliberately separate follow-up changes — building the UI before the model is settled risks reworking it once the model changes.

## What Changes

- Add `siteAdmin` (boolean) and `siteRules` (text array) to the existing `user` table — a global superadmin flag that bypasses every permission check everywhere, plus an optional set of site-wide permission grants for non-superadmin users (e.g. someone who can manage KB content without full superadmin).
- Add `entities` (id, name) — Northern Rural Networks today. The schema doesn't assume it stays the only one, but nothing beyond this table exists to support a second entity yet, matching Robin's own "NRN only for now" decision.
- Add `groups` (id, entityId, name, unique per entity) — Support, Sales, Billing, Dispatch, etc., each belonging to exactly one entity.
- Add `groupMemberships` (userId, groupId, tier, rules[], status) — a user's assignment to a group. `tier` is an optional ordered value (e.g. Support's T1/T2/T3) for departments with escalation levels; most groups will leave it null. `rules[]` is an individually-tunable permission set, not derived from tier. `status` (active/revoked) preserves history rather than deleting rows.
- Add `groupInvitations` (groupId, email, tier, rules[], invitedByUserId, acceptedAt) — invite-by-email before the person has ever signed in, converted into a real `groupMemberships` row the moment that email signs in.
- Add a small starter site-wide rule catalog (new `packages/shared` schema module): `manage_users`, `manage_groups`, `manage_entities`, `manage_kb_content`. Deliberately minimal — department-specific permissions are forward-looking per Robin ("I'd rather think on that more as the rest of the site develops") and get added once the features needing them exist.
- Add authorization helpers (`apps/api/src/lib`): a superadmin guard, site-rule and group-rule checks, and the pending-invitation-application logic (run during session resolution, mirroring how `magic-link-auth` already resolves a session on every request).
- **BREAKING**: none — every new field is additive, and no existing behavior changes for any current user (no one has `siteAdmin` or any group membership yet).
- Bootstrap `rgsamways@gmail.com`'s `siteAdmin` flag via the same session-resolution hook used for invitations (self-healing on next sign-in, regardless of whether that account exists before or after this change deploys), since no admin UI exists yet to set it any other way.
- **Explicitly not in this change**: no new HTTP routes, no new UI pages. This is the model and its enforcement primitives; the admin screen and invite-sending flow are separate follow-up changes that will call these primitives.

## Capabilities

### New Capabilities
- `entity-group-permissions`: entities, groups, group memberships (with tier and individually-tunable rules), group invitations, a starter site-wide permission catalog, and the authorization primitives that check all of it.

### Modified Capabilities
(none — `magic-link-auth`'s four requirements are unchanged. This adds unrelated columns to the same `user` table and hooks additional logic into session resolution, but doesn't alter any of that capability's specified sign-in behavior.)

## Impact

- **Affected code**: `apps/api/src/db/auth-schema.ts` (new `user` columns), a new `apps/api/src/db/permissions-schema.ts` (entities/groups/groupMemberships/groupInvitations), a new `packages/shared` rules module, new `apps/api/src/lib` authorization helpers, a new Drizzle migration, a small addition to `apps/api/src/lib/get-session.ts` to apply pending invitations on session resolution.
- **Not affected**: `apps/web` (no UI in this change), the magic-link sign-in flow itself, `packages/cases`/`kb`/`simulation-engine`/`console-schema`/`dashboards`.
- **Unlocks**: the user admin screen, the invite-sending UI, and the differentiated public/staff sign-in experience — each its own future change built on these primitives.
