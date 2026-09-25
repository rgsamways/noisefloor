## 1. Shared rule catalog

- [x] 1.1 Add `packages/shared/src/schemas/rules.ts` exporting a small starter site-wide rule catalog (`manage_users`, `manage_groups`, `manage_entities`, `manage_kb_content`) as a `z.enum`-backed `RuleKey` type, matching kerfy's `ALL_RULE_KEYS`/`ruleKeySchema` pattern; export it from `packages/shared/src/index.ts`; verify with a small schema test asserting a known key parses and an unknown one is rejected

## 2. Schema: siteAdmin/siteRules on user, new permission tables

- [x] 2.1 Add `siteAdmin: boolean().notNull().default(false)` and `siteRules: text().array().notNull().default([])` to `apps/api/src/db/auth-schema.ts`'s `user` table
- [x] 2.2 Create `apps/api/src/db/permissions-schema.ts` with `entities` (id uuid, createdAt, updatedAt, name), `groups` (id uuid, createdAt, updatedAt, entityId FK → entities cascade, name, unique index on entityId+name), `groupMemberships` (id uuid, createdAt, updatedAt, userId FK → user cascade, groupId FK → groups cascade, tier nullable text, rules text array default [], status enum active/revoked default active, unique index on userId+groupId), `groupInvitations` (id uuid, createdAt, groupId FK → groups cascade, email text, tier nullable text, rules text array default [], invitedByUserId text no FK, acceptedAt nullable timestamp)
- [x] 2.3 Run `pnpm --filter @noisefloor/api db:generate` to produce the migration, verify the generated SQL matches the schema above, and apply it locally with `pnpm --filter @noisefloor/api db:migrate`

## 3. Authorization primitives

- [x] 3.1 Add `apps/api/src/lib/site-admin.ts` (or extend an existing lib file) exporting `hasSiteRule(user, rule)` (siteAdmin bypass, else checks `siteRules`) and a `requireSiteAdmin` Fastify preHandler-style guard mirroring `kerfy-admin.ts`'s `requireKerfyAdmin`, verified by unit tests covering both bypass and non-bypass paths
- [x] 3.2 Add `apps/api/src/lib/group-authorization.ts` exporting `hasGroupRule(userId, groupId, rule, isSiteAdmin)` (siteAdmin bypass, else an active-membership lookup checking `rules`), verified by unit tests covering: siteAdmin bypass, active membership with the rule, active membership without the rule, and a revoked membership (must fail even if `rules` includes it)
- [x] 3.3 Add `apps/api/src/lib/group-invitations.ts` exporting `applyPendingGroupInvitations(userId, email)`, adapted from kerfy's `company-invitations.ts` (case-insensitive email match, skip if a membership already exists, mark accepted), verified by a unit test that creates a pending invitation, applies it, and asserts the membership and `acceptedAt` are both correct, plus a test that a second call is a no-op
- [x] 3.4 Add the bootstrap-siteAdmin check (design.md's Decision 7) — a small function checking the resolved user's email against one hardcoded bootstrap address and setting `siteAdmin = true` if not already, verified by a unit test for both a fresh account and a pre-existing account with `siteAdmin` still false
- [x] 3.5 Wire `applyPendingGroupInvitations` and the bootstrap-siteAdmin check into `apps/api/src/lib/get-session.ts`'s `getSession`, called once per resolved session; verify via an integration test using `createTestSession`-style sign-in that a pending invitation for the freshly-created test account's email becomes a real membership after sign-in

## 4. Spec conformance

- [x] 4.1 Run `openspec validate --change add-entity-group-permissions --strict` and resolve any reported issues
- [x] 4.2 Confirm every scenario in `specs/entity-group-permissions/spec.md` has a corresponding passing test from tasks 1-3
