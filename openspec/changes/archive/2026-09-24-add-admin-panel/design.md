## Context

See proposal.md for motivation. Grounded in what's actually there today (verified by reading the code, not assumed):

- **Routing**: `apps/web/src/App.tsx` uses plain React Router 8 `<Routes>/<Route>`, no data-router loaders. `RequireAuth.tsx` is the existing pattern for a gated route — a layout route wrapping `<Outlet/>`, redirecting via `authClient.useSession()` client-side.
- **Styling**: two page shells exist, not one. `HudPageShell` (dark, `#05070a`, accent `#3dffc4`, JetBrains Mono) is used only by `/console` and `/kb`. `PageShell` (light, `--paper`) is used by `/me`, `/cases`, `/about`, etc. — including `/me`, the closest existing "your own account" page. There is no `<table>` anywhere in the app; `KbIndex.tsx`'s search+filter-chips+card-grid is the closest existing "list" pattern, built from plain divs, not a reusable table component.
- **API conventions**: Zod schemas defined inline per route file (`attempts.ts`), errors always `reply.status(code).send({ error: "lowercase short message" })`, session via `const session = await requireSession(request, reply); if (!session) return;` at the top of each handler.
- **Client fetching**: one small wrapper, `apps/web/src/lib/api.ts`'s `apiFetch<T>`, no react-query. Consumers (`CasePlayer.tsx`) use plain `useState`/`useEffect`.
- **Email**: `send-magic-link.ts` is the exactly reusable pattern — log to console when `RESEND_API_KEY` is unset (local dev), otherwise POST to Resend's API directly, throw on a non-OK response.
- `entity-group-permissions` (already shipped) has zero HTTP routes and zero UI — `requireSiteAdmin`, `hasGroupRule`, `applyPendingGroupInvitations` all exist as pure functions, unused by any registered route.

## Goals / Non-Goals

**Goals:**
- Make every primitive `entity-group-permissions` built actually reachable and usable by Robin.
- Keep the admin surface entirely siteAdmin-gated — no delegated per-group admin UI yet, matching that change's own Non-Goals.

**Non-Goals:**
- Entity creation/management UI. One entity, seeded once, per Decision 1.
- Any UI for a non-siteAdmin user to see or manage their own group memberships (a "my groups" view). Out of scope until the differentiated sign-in experience change needs it.
- Deleting a user's account. "Removing a user" means revoking their group memberships (proposal.md); full account deletion isn't a capability the app has anywhere today, for any user.
- A generic reusable `<Table>` component for the wider app. This change introduces table markup scoped to the admin page; generalizing it is a future concern if a second consumer shows up (matches this project's own "second consumer" extraction pattern used elsewhere).

## Decisions

**1. The one entity ("Northern Rural Networks") is seeded via a migration data statement, not built through a UI.** A CRUD screen for a set of exactly one, with no second entity expected soon, is pure ceremony. The admin API resolves "the" entity server-side (the one row in `entities`) rather than taking an `entityId` from the client — if a second entity is ever added, every one of these routes needs revisiting anyway, so there's nothing to gain by threading an ID through now that today's UI would never actually let the user choose.
*Alternative considered:* build entity CRUD now for forward-compatibility. Rejected per the project's standing "don't design for hypothetical future requirements" norm — this exact question was already raised and settled the same way when `entity-group-permissions` was scoped ("NRN only for now").

**2. All admin routes live in one file, `apps/api/src/routes/admin.ts`, gated uniformly by `requireSiteAdmin`.** Kerfy splits admin-only control-plane routes (`admin-console.ts`) from company-scoped, delegatable routes (`memberships.ts`) because it has a real delegation model (`canManageMembershipsForCompany`, checking a `manage_users` rule via membership). noisefloor doesn't build that delegation model in this change — every admin action here requires `siteAdmin`, full stop — so there's no split to make yet. If group-scoped delegation is added later, splitting this file is the natural point to do it.

**3. The admin page uses `HudPageShell`, not the light `PageShell`.** `/admin` is a staff power-tool in the same spirit as `/console` (an instrument, not a reading page) — it fits the HUD chrome's existing category better than `/me`'s light self-service framing. `RequireSiteAdmin` follows `RequireAuth`'s exact shape (a layout route checking `session.user.siteAdmin` via `authClient.useSession()`, redirecting non-admins to `/` since there's nothing for them to see, unlike `RequireAuth`'s redirect to `/sign-in` for an anonymous visitor who at least has somewhere useful to go).
*Alternative considered:* light `PageShell`, matching `/me`. Rejected — `/me` is "your own progress," a reading experience; `/admin` is an operator console, matching `/console`'s own category more closely.

**4. Member/user lists render as real `<table>` markup, not another card grid.** `KbIndex`'s card grid fits prose-heavy, few-item content; admin data (many rows, few columns: name, email, tier, status) is the classic table shape, and forcing it into cards would be worse UX for no styling consistency gain — nothing else in the app currently needs a list like this to match against.

**5. Inviting an already-registered email grants membership immediately, mirroring `entity-group-permissions`' own design for `applyPendingGroupInvitations` and kerfy's identical behavior.** Both already treat "the person already has an account" as a reason to skip the invitation step entirely rather than making them wait for a sign-in that isn't needed — this route reuses that reasoning rather than always creating a `groupInvitations` row regardless of whether the email already resolves to a user.

**6. Invitation emails reuse `send-magic-link.ts`'s exact pattern (console-log fallback, direct Resend POST), in a new `send-invite-email.ts`.** Not a shared abstraction over both — two email templates, each simple, don't yet justify one. Revisit if a third email type shows up.

## Risks / Trade-offs

- **[Risk]** Letting a siteAdmin grant `siteAdmin` to another user through this UI, with no additional confirmation step, means one careless click hands over full superadmin access. → **Mitigation**: acceptable for now — the only person who can reach this screen at all is already a siteAdmin, so this isn't a privilege-escalation path for anyone who doesn't already have the keys. Revisit with a confirmation dialog if this ever becomes a multi-siteAdmin operation done routinely rather than rarely.
- **[Risk]** No pagination on the groups/users/members lists. → **Mitigation**: acceptable at today's scale (one entity, a handful of groups, an NRN-sized staff roster); revisit if any list grows large enough to matter.

## Migration Plan

One new Drizzle migration: seed `entities` with a single row named "Northern Rural Networks". No changes to existing tables. Land order: migration + API routes first (verifiable via tests without any UI), then the web page and its guard, same "backend then frontend" order as `kb-content-model-and-search` and `entity-group-permissions` both used.
