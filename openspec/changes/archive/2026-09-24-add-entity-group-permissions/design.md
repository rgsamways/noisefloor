## Context

See proposal.md for motivation. This design is directly informed by `kerfy`'s own permission model (`apps/api/src/db/control-plane-schema.ts`, `lib/kerfy-admin.ts`, `lib/membership-authorization.ts`, `lib/identity-resolution.ts`, `lib/company-invitations.ts`, `packages/shared/src/schemas/rules.ts`), which Robin asked to look at for ideas. Key patterns reused directly: a global superadmin boolean flag on `user` rather than a membership row; permission keys as a plain text array (not a DB enum) so the catalog grows without migrations; invitations by email that convert into a real membership the moment that email signs in; membership status (`active`/`revoked`) instead of deletion.

Key difference from kerfy that shapes this design: kerfy is genuinely multi-tenant with **one separate business database per company**, so a signed-in identity must pick which company's database to operate against (`identity-resolution.ts`'s `selectedCompanyId` / "needs selection" flow). noisefloor has **one single Postgres database** (confirmed: `apps/api/src/db/client.ts`, one `DATABASE_URL`) — there is no per-tenant data to route to, so there is no equivalent "company picker" step. A user's access is just an ambient set of (site rules) plus (group, rules) pairs, checked directly against whatever a route needs; nothing about this change requires a user to "select" an entity or group before proceeding.

Current auth (`apps/api/src/db/auth-schema.ts`, `apps/api/src/lib/get-session.ts`): Better Auth with the magic-link plugin, a standard `user`/`session`/`account`/`verification` schema, and a single `getSession(request)`/`requireSession(request, reply)` helper called manually at the top of each protected route — no middleware/hook layer.

## Goals / Non-Goals

**Goals:**
- Model entities, groups, memberships (with tier and individually-tunable rules), and invitations, adapted from kerfy's proven shape to noisefloor's single-database reality.
- Provide the authorization primitives (`requireSiteAdmin`-equivalent, site-rule check, group-rule check, invitation application) that future routes/UI will call.
- Bootstrap Robin's own account as `siteAdmin`.

**Non-Goals:**
- Any new HTTP route or UI page. Nothing here is reachable by a browser yet.
- A real site-wide or per-group rule catalog beyond a small starter set — deliberately deferred per Robin ("I'd rather think on that more as the rest of the site develops").
- A "last admin can't be removed" style guardrail (kerfy has this for `org_admin`). Nothing in this change can yet modify `siteAdmin` or memberships through the app (no UI exists), so the guardrail has nothing to protect against yet — revisit when the admin screen is built.
- Role-to-default-rules bundling (kerfy's `ROLE_DEFAULT_RULES`/`defaultRulesForRoles`). Kerfy's `roles[]` (informal titles bulk-applying a default rule set) doesn't have a clear noisefloor analog yet since there's no real per-group rule catalog to bundle — `groupMemberships.rules` is populated directly for now. Revisit once real group-specific permissions exist to bundle.
- Hierarchical or multi-entity-aware group nesting. Tier is a flat, optional value on the membership row (Decision 4), not a group hierarchy — a deliberate choice over kerfy's own model, which has no tier concept at all.

## Decisions

**1. `siteAdmin` (boolean) and `siteRules` (text array) both live directly on `user`.** Mirrors kerfy's `kerfyAdmin` flag exactly for the bypass; `siteRules` is new (kerfy has no non-superadmin platform-wide grant — its `PLATFORM_ONLY_RULES` are bypass-only, never actually granted to anyone but a `kerfy_admin`). noisefloor's Robin explicitly wants a middle tier ("permissions for the site as a whole" separate from full superadmin), so `siteRules` gives that a home: an array column on the row the grant applies to, the same principle kerfy uses for `memberships.rules[]`.
*Alternative considered:* a separate `siteMemberships`-style table. Rejected — there's exactly one thing to attach site-wide rules to (the user), so a second table would just be `user`'s own row split across two tables for no benefit.

**2. `entities` and `groups` are plain lookup/grouping tables with no per-tenant database resolution.** Unlike kerfy's `companies` (which also carries `databaseUrlEnvVar` to resolve a separate business database), noisefloor's `entities` has nothing beyond `id`/`name` — there is no per-entity data to route to in a single-database app.

**3. Tier is a nullable column on `groupMemberships`, not a separate table or group hierarchy.** Per Robin's own explicit decision this session: an ordered value (e.g. Support's T1/T2/T3) attached to the membership row, most groups leaving it null. Deliberately not derived into or from `rules` — a membership's tier and its rules are independently editable, same relationship kerfy's `roles[]` and `rules[]` have (informal/bulk-convenience vs. actually enforced), except here there's no bundling logic yet (see Non-Goals).

**4. Permission keys are plain strings, not a DB enum — reusing kerfy's own reasoning verbatim.** `groupMemberships.rules` and `user.siteRules` are `text[]`; the site-wide catalog (`packages/shared`) is a plain string union via Zod, matching kerfy's `RuleKey`/`ruleKeySchema` pattern. Extending the catalog later never requires a migration.

**5. `groupInvitations` mirrors kerfy's `companyInvitations` exactly, scoped to group instead of company.** No FK from the invitation to `user` (the inviter may not exist by the time it's read back); email stored lowercased at write time, matched case-insensitively at apply time; applied via a function called during session resolution (self-limiting once `acceptedAt` is set), not a dedicated endpoint — there's no route layer in this change to hang one off of.

**6. Invitation application hooks into `get-session.ts`, not a new middleware layer.** `getSession`/`requireSession` already run on every protected request; adding the apply-pending-invitations call there (keyed on the resolved user's id/email) matches kerfy's own comment that this runs "on every session resolution." No new hook/lifecycle mechanism needed.

**7. Bootstrap `rgsamways@gmail.com` as `siteAdmin` via the same session-resolution hook as invitation application, not a one-time migration data statement.** A migration `UPDATE` only fires once, at deploy time — if that account doesn't exist yet at that moment (unconfirmed either way, and not worth blocking on finding out), the flag would never get set, and a later sign-in would create the row with the default `false` with nothing left to fix it. Instead, `get-session.ts`'s hook also checks the resolved user's email against a single hardcoded bootstrap address and sets `siteAdmin = true` if it isn't already — idempotent, self-healing on the next sign-in regardless of whether the account existed before this change deployed or gets created after.
*Alternative considered:* the migration-statement approach described above. Rejected once the ordering problem became clear while writing this doc — moved to the session-hook approach instead of leaving it as a hand-waved risk.

## Risks / Trade-offs

- **[Risk]** `siteRules` and `groupMemberships.rules` both reference rule keys from catalogs that don't yet reflect real product decisions (the starter set is intentionally thin). → **Mitigation**: explicitly scoped as forward-looking scaffolding, not a finished permission model — Robin confirmed this directly ("I'd rather think on that more as the rest of the site develops").
- **[Risk]** No guardrail yet prevents ending up with zero `siteAdmin` users (kerfy has an analogous "last admin" protection for `org_admin`). → **Mitigation**: acceptable for now since nothing in the app can change `siteAdmin` yet (no UI); must be revisited before the admin screen ships write access to this flag.
- **[Risk]** Hooking invitation-application into `get-session.ts` adds a DB round-trip to every session resolution, even for users with no pending invitations. → **Mitigation**: the query is a simple indexed lookup by lowercased email with `acceptedAt IS NULL`, the same cost profile kerfy already accepts in production; revisit only if it shows up as a real latency issue.

## Migration Plan

One Drizzle migration: `user` gains `siteAdmin`/`siteRules`; new tables `entities`, `groups` (unique index on `entityId`+`name`), `groupMemberships` (unique index on `userId`+`groupId`), `groupInvitations`. No data statement in the migration itself — the bootstrap (Decision 7) happens in application code on session resolution, so it applies correctly whenever `rgsamways@gmail.com` actually signs in, whether that's before or after this migration deploys.
