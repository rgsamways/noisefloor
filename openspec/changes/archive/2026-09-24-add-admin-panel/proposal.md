## Why

`entity-group-permissions` built the data model and enforcement primitives (entities, groups, memberships, invitations, siteAdmin) but shipped no way to actually use them — the only way to create a group or grant access today is a raw database statement. This change adds the admin screen and its backing API routes so Robin can actually run this: create groups under Northern Rural Networks, invite people into them, and manage who has what access, all gated to `siteAdmin` only (no delegation model exists yet — see that change's design.md Non-Goals).

## What Changes

- Seed the one entity ("Northern Rural Networks") via a migration data statement — no entity-creation UI or route in this change, since a second entity isn't expected soon (per the earlier explicit "NRN only for now" decision) and seeding it once is simpler than building a CRUD screen for a set of exactly one.
- Add `apps/api/src/routes/admin.ts`, a single `siteAdmin`-gated route file (mirrors kerfy's own `admin-console.ts`, which is also superadmin-only with no delegation): list/create groups, list a group's members/pending invitations, invite an email to a group (creating an immediate membership if that email already has an account, otherwise a pending invitation — mirroring kerfy's `company-invitations.ts` behavior), update a membership's tier/rules, revoke a membership, cancel a pending invitation, list all users with their `siteAdmin`/`siteRules`, and update a user's `siteAdmin`/`siteRules`.
- Add a new email template + send function (`apps/api/src/lib/send-invite-email.ts`, following `send-magic-link.ts`'s exact Resend-or-console-log pattern) so an invitation actually notifies the invited person, not just writes a database row.
- Add `/admin`, a new siteAdmin-only page in `apps/web`: a group list with a create-group action, a per-group member table (email, tier, rules, status) with invite/edit/revoke actions, and a users table for site-wide `siteAdmin`/`siteRules` management.
- Add `RequireSiteAdmin`, a new route guard component (`apps/web/src/components/RequireSiteAdmin.tsx`) mirroring `RequireAuth.tsx`'s pattern but checking `session.user.siteAdmin`, redirecting non-admins.
- **"Removing a user" is scoped to revoking their group memberships**, not deleting their account — there's no user-facing account deletion anywhere in the app today, and a person's account is created by their own magic-link sign-in, not by an admin, so there's nothing for "add a user" to mean beyond inviting them to a group.
- **BREAKING**: none — every new route and page is additive; no existing behavior changes.

## Capabilities

### New Capabilities
- `admin-panel`: the siteAdmin-only screen and API routes for managing groups, group memberships, group invitations, and site-wide user permissions. Depends on `entity-group-permissions`'s data model and primitives but is its own capability, matching that change's own stated intent to keep the model and the UI separate.

### Modified Capabilities
(none — `entity-group-permissions`'s requirements are unchanged; this only adds consumers of it)

## Impact

- **Affected code**: one new migration (entity seed), `apps/api/src/routes/admin.ts`, `apps/api/src/lib/send-invite-email.ts`, `apps/web/src/pages/Admin.tsx` (or a small set of admin page components), `apps/web/src/components/RequireSiteAdmin.tsx`, `apps/web/src/App.tsx` (new route), `apps/web/src/lib/api.ts` (new typed calls, if needed).
- **Not affected**: `entity-group-permissions`'s schema/primitives (used, not changed), the magic-link sign-in flow, every other existing page/route.
- **Unlocks**: this is the last piece needed before the differentiated public/staff sign-in experience — that change can now check real group memberships instead of having nothing to check.
