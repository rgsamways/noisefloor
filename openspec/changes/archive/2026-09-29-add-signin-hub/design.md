## Context

See proposal.md - Why. `hasGroupRule(userId, groupId, rule, isSiteAdmin)` (`apps/api/src/lib/group-authorization.ts`) checks one specific group at a time — it has no notion of "does this user hold this rule via *any* of their groups," which is what both the session rollup and the new route gates actually need. `GET /api/session` (`apps/api/src/routes/session.ts`) already returns `siteAdmin`/`siteRules` through the authoritative `getSession` path (the only place `applyPendingGroupInvitations`/`applyBootstrapSiteAdmin` run) — `RequireSiteAdmin.tsx`'s own comment explains why the client can't just trust its cached Better Auth session for this.

## Goals / Non-Goals

**Goals:**
- One shared computation for "this user's rules across every active group membership," reused by both the session response and the new route gates — not two different implementations of the same union.
- The hub reflects real, enforced access, not a UI-only guess — every card it shows corresponds to a route that will actually let that user in.

**Non-Goals:**
- Any real ticket data model (customer/site/ticket tables, `ticket_event` log) — captured as future design direction (see project memory), not built here. Tickets' actual page content in this change is just the relocated GenieACS lookup.
- No customer-facing functions — future work this change only makes room for by keeping the zero-memberships hub state generic.
- Redesigning `RequireAuth`/`RequireSiteAdmin` — the hub is a new destination reached through them, not a replacement.

## Decisions

**A new `getMyGroupRules(userId, isSiteAdmin)` helper in `group-authorization.ts`, alongside `hasGroupRule`.** Returns the union of `rules` across every `active` membership row for that user (siteAdmin short-circuits to "everything," same exemption `hasGroupRule` already has). Both `GET /api/session`'s extended response and the new route-gating guard call this one function — no duplicate union logic.

**Route gating via a new `requireGroupRule(rule)` guard, mirroring `requireSiteAdmin`'s shape.** A factory function returning a Fastify `preHandler`: resolves the session, 401s if none, calls `getMyGroupRules`, 403s if the rule isn't in the result (siteAdmin always passes). Applied to `eod-reports.ts`'s four routes and `cases.ts`/`attempts.ts`'s six routes per the modified specs' exact rule-per-route mapping.

**`GET /api/session` gains `groupRules: string[]`, not a new endpoint.** Same authoritative path already relied on for `siteAdmin`; the hub calls this one existing route rather than two.

**Hub page lives at `/hub`, replacing `/` as `SignIn.tsx`'s `callbackURL`.** `/` (Landing) stays exactly as-is for anonymous visitors — this only changes where a completed sign-in lands, not what anonymous visitors see.

**`Admin.tsx` splits into two pages, both still `siteAdmin`-only.** "Users and Groups" (unchanged: `GroupsSection`/`UsersSection`) and "Site Settings" (unchanged: `SettingsSection`, the EOD report mode toggle) — same components, same gating, just two routes instead of one page. No behavior change, purely a page-structure reorg, which is why neither the `admin-panel` spec's existing "every admin route and page requires siteAdmin" requirement nor any new spec entry is needed for this split.

**A new Reports page consolidates EOD reports under one rule-gated area.** Replaces the personal `/me` page's role as the sole EOD-report destination — same underlying `eod-reports.ts` routes (now rule-gated per the modified spec), same form/UI content, just reachable from the Hub's Reports card by anyone holding `submit_eod_report` or `view_own_eod_reports`, not only whoever happens to know the `/me` URL.

**Tickets is a new page whose only content right now is the relocated GenieACS lookup.** Built and gated (`requireGroupRule("view_device_status")`) under `add-genieacs-device-status`'s own revised tasks, not this change's — this change only adds the Hub card pointing at it and the route in `App.tsx`.

**Hub card visibility is a plain client-side rule-key check, matching each card to the rule(s) its route requires** — Users and Groups and Site Settings require `siteAdmin`; Reports requires `submit_eod_report` OR `view_own_eod_reports`; Tickets requires `view_device_status`. Not a generic "list of things," a hardcoded small table of `{card, requiredRule}` — there are only four cards today, and a generic driven-by-catalog approach would need every future feature to also declare its own "hub card" metadata, which is speculative given how much this exact card list has already changed this session.

**No new component library for the "visitor" state — literally the same links `HudFloorNav`/`ContentFooterLinks` already surface** (KB, Console, Roadmap, About), laid out as cards instead of nav links. Per the user's explicit instruction, this state is NOT named or coded as "visitor" anywhere — no persona-specific copy or logic that would need rewriting once this bucket includes real customers. It's simply "no operational cards to show."

## Risks / Trade-offs

- **Tightening `/cases`, `/attempts`, and EOD reports is a real access change for any existing non-siteAdmin account without a matching group membership** → intentional, called out plainly in the proposal; siteAdmin always bypasses. Worth a quick check after shipping that no real in-use non-admin account gets locked out unexpectedly.
- **The hardcoded `{card, requiredRule}` table will need a new entry for every future gated feature** → acceptable now; revisit if/when enough hub cards exist that this becomes its own maintenance burden.

## Migration Plan

Mostly additive (`getMyGroupRules`, `requireGroupRule`, the extended session response, the new Hub/Reports/Tickets pages, the `Admin.tsx` split into two routes). The non-additive pieces are the `/cases`/`/attempts`/EOD-reports gating and the sign-in redirect target — both real, intentional behavior changes with no feature flag or rollback beyond reverting the commit.
