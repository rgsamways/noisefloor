## Context

See proposal.md for motivation. Grounded in what's actually there today:

- `apps/api/src/db/auth-schema.ts`'s `user` table: `session.userId` and `account.userId` both already `onDelete: cascade`. `apps/api/src/db/permissions-schema.ts`'s `group_memberships.userId` is also already `onDelete: cascade`. `group_invitations` has no `userId` column at all — it's keyed by `email` (a plain text column, no FK), so it survives a user delete untouched, same as it survives today if an invited email never signs up.
- `apps/api/src/routes/admin.ts`'s existing `PATCH /api/admin/users/:id` already reads the current session via nothing (it doesn't check who's making the request beyond `requireSiteAdmin`) and has no guard preventing `siteAdmin: false` on the last remaining siteAdmin.
- Confirmed via production query: both existing users (`rgsamways@gmail.com`, `robin.nrntech@gmail.com`) have `name: ''`. Better Auth's magic-link plugin never sets it — `apps/api/src/auth.ts` has no name-handling logic (grepped, only an unrelated `authUrlHost` match).
- `apps/web/src/pages/Admin.tsx`'s `UsersSection` already has the `reload`-on-failure pattern (from the cancel/revoke fix) — new actions here should follow it too.
- No modal/dialog component exists anywhere in `apps/web` for a real confirmation UI (grepped `Dialog`/`Modal`/`confirm(` — the only matches are an unrelated CRM dashboard component, `RealtimePingModal`).

## Goals / Non-Goals

**Goals:**
- Let a siteAdmin permanently remove an account, closing the gap `add-admin-panel` explicitly deferred.
- Close the "delete the last siteAdmin" hole before it's possible to lock everyone out of `/admin` with no recovery path.
- Give every user a real `name`, and a `title`, editable from the same screen — nothing else in the app can set either today.

**Non-Goals:**
- Any soft-delete, deactivation, or "archived user" state. Robin's own framing was explicit: hard delete now.
- Any handling for future historical/ticketing data referencing a deleted user. Doesn't exist yet; per proposal.md, this is a note for whenever it's designed, not a requirement here.
- A reusable confirmation dialog component. One destructive button on a two-person admin screen doesn't justify building UI infrastructure — see Decision 3.
- Letting a user edit their own name/title from `/me`. This change is about the admin's ability to manage other accounts' records; a self-service profile page is a different, unrelated capability.

## Decisions

**1. The last-siteAdmin guardrail only guards the PATCH-to-unset-siteAdmin path, not the delete route.** Both routes are gated by `requireSiteAdmin`, so the caller is always a siteAdmin. On PATCH, a siteAdmin can target *themselves* and set `siteAdmin: false` (self-demotion) — if they're the last one, that's a real way to zero out the count, so the check is needed there: before applying `siteAdmin: false`, count how many *other* users have `siteAdmin: true` and reject with 409 if zero. On DELETE, self-delete is already blocked outright (Decision 2), so the target is always someone other than the caller — and the caller, being a siteAdmin who isn't the target, is never removed from the count by that delete. A delete therefore can never actually reduce the siteAdmin count to zero; adding the same check there would be unreachable dead code, not defense in depth. Implemented as one small helper, `wouldRemoveLastSiteAdmin(excludingUserId)` in `admin.ts`, called only from the PATCH handler.
*Alternative considered:* apply the same check to both routes uniformly, for symmetry. Rejected once the reachability analysis above showed it can never fire on delete — shipping a check that can't trigger just to look symmetric would misrepresent what the code actually protects against, and the accompanying test would have no real scenario to exercise.

**2. Deleting your own account is blocked outright.** If Robin (or any siteAdmin) deletes their own row mid-session, their session is cascade-deleted along with them — an immediate, confusing self-lockout with no error message to explain it, and this holds even when other siteAdmins exist (Decision 1's count-based guard wouldn't catch it, since deleting yourself doesn't reduce the count of *other* siteAdmins). Comparing the request's session `user.id` to the target `:id` and rejecting with 409 is a one-line check against a real failure mode, not speculative hardening.

**3. Confirmation before delete is a native `window.confirm()`, not a custom dialog component.** This app has zero modal/dialog infrastructure anywhere (Context, confirmed by grep). Building one to gate a single destructive button on a screen only Robin uses is exactly the "don't design for hypothetical future requirements" case — `window.confirm` blocks synchronously, needs no new component, and is the same tool already trusted for "irreversible action" gates in plenty of small internal tools. Revisit only if a second destructive confirmation shows up elsewhere and a shared pattern actually starts paying for itself.
*Alternative considered:* type-the-email-to-confirm (common for high-stakes deletes). Rejected as overkill for an admin screen with two total users today; `window.confirm`'s message can still state the user's email plainly so a misclick is easy to catch.

**4. `name` and `title` are edited inline in the existing Users table row, not a separate edit screen.** Matches the existing `siteAdmin` toggle's inline-edit pattern in the same table (`Admin.tsx`'s `UsersSection`) rather than introducing a second interaction style (e.g. a modal form) for what's still just two more editable text fields on the same row.

**5. `title` is a new nullable `text` column on `user`, not reused/overloaded from `siteRules` or any existing field.** It's a distinct, free-text piece of identity information (e.g. "T1", "Network Admin") with no relationship to permission rules — conflating it with `siteRules` (which is enforcement-facing, drawn from `packages/shared`'s rule catalog) would make both harder to read.

## Risks / Trade-offs

- **[Risk]** Hard delete is irreversible; a `window.confirm` is the only guard. → **Mitigation**: acceptable per Robin's explicit choice of hard delete over soft delete, and the same reasoning `add-admin-panel`'s design.md already accepted for the siteAdmin-grant action (only siteAdmins can reach this screen at all).
- **[Risk]** No audit trail of who deleted whom, or when. → **Mitigation**: acceptable at today's scale (one entity, single-digit staff); revisit if this ever needs to be reconstructable after the fact.

## Migration Plan

One new Drizzle migration: add nullable `title` column to `user`. No backfill needed (nullable, defaults to null for existing rows). Land order: migration + API route/guardrails first (verifiable via tests without any UI), then the Admin.tsx changes — same "backend then frontend" order `add-admin-panel` itself used.
