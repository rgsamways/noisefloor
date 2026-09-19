## Why

noisefloor is a brand-new repository with no code yet — only its founding brief (`NOISEFLOOR-OUTLINE.md`) and delivery plan (`PROJECT-PLAN.md`). Before any case content or dashboard component can exist, the repo needs a working pnpm workspace, the core data contract (`Case`/`World`/`Stage` schemas) that every later feature builds on, the deterministic series generators cases will render from, and a working sign-in flow deployed end to end. This is Phase 0 of `PROJECT-PLAN.md` §4 — the foundation every later phase depends on.

## What Changes

- Scaffold the pnpm workspace: `apps/web`, `apps/api`, `packages/shared`, `packages/dashboards`, `packages/cases`, mirroring the `kerfy` project's root tooling (TypeScript strict config, ESLint flat config, Vitest) exactly, per `PROJECT-PLAN.md` decision D2.
- Add Zod schemas in `packages/shared` for the core case-content data model defined in `NOISEFLOOR-OUTLINE.md` §5: `Case`, `World`, `Stage`, `Evidence`, `Prompt`, `Rubric`, `Debrief`, `Gotcha`.
- Add a seeded RNG and the five series generators from `NOISEFLOOR-OUTLINE.md` §5.3 (`diurnalUsage`, `noisyCeiling`, `foliageYear`, `shaperCollapse`, `pinglogMonth`), unit-tested, so the same case always draws the same chart.
- Wire Better Auth's magic-link plugin in `apps/api`, mirroring `kerfy`'s implementation (`send-magic-link.ts`, cross-subdomain cookie handling) per decision D5 — Resend for delivery, console-logged link when `RESEND_API_KEY` is unset.
- Stand up an empty Postgres schema via Drizzle (auth tables only at this phase — `users`/`attempts`/`stage_commits`/`gotcha_progress` per `NOISEFLOOR-OUTLINE.md` §10 come with Phase 2's case engine, not here).
- Deploy a minimal "hello" page at `noisefloor.ca` (Vercel) backed by a working API on Railway, to prove the whole chain — workspace, auth, deploy — functions end to end before any product feature is built on top of it.

## Capabilities

### New Capabilities
- `case-content-schema`: the Zod schemas and TypeScript types for `Case`/`World`/`Stage`/`Evidence`/`Prompt`/`Rubric`/`Debrief`/`Gotcha` that every later case-authoring and case-player feature validates against.
- `series-generators`: the deterministic, seeded-RNG data generators (`diurnalUsage`, `noisyCeiling`, `foliageYear`, `shaperCollapse`, `pinglogMonth`) that produce a `World`'s time-series data from a small set of parameters.
- `magic-link-auth`: passwordless sign-in — request a link by email, click it, get a session — deployed at `noisefloor.ca` / `api.noisefloor.ca`.

### Modified Capabilities
_(none — this is a new repository, nothing exists yet to modify)_

## Impact

- **New repo structure**: `apps/web`, `apps/api`, `packages/shared`, `packages/dashboards` (empty until Phase 1), `packages/cases` (empty until Phase 2), plus root tooling config.
- **New infrastructure**: a Railway project (Postgres + API service) and a Vercel project (web), plus DNS for `noisefloor.ca` / `api.noisefloor.ca` pointed at them.
- **New dependency**: Resend, for magic-link email delivery.
- **No impact on any other repository** — `kerfy`'s conventions are mirrored, never imported or shared as code, per `PROJECT-PLAN.md` decision D1.
