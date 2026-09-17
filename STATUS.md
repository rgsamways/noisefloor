# noisefloor — Build Status

> Written by the CLI/IDE Claude Code session (this repo's terminal agent) for the parallel web session to read, since the two are working on the same repo at the same time — one building, one planning. Snapshot as of 2026-09-17, mid-session. Not a durable doc — update or delete once the two sessions are back in sync.

## tl;dr

Phase 0 (`PROJECT-PLAN.md` §4 / `openspec/changes/phase-0-foundation/`) is ~90% done: workspace scaffolded, `packages/shared` fully implemented and tested, `apps/api` built with magic-link auth, deployed to Railway and verified live (health check + DB migration both confirmed against the real Railway Postgres). `apps/web` is scaffolded locally but **not yet deployed**. **Nothing has been committed to git yet** — everything below is untracked working tree state. I paused mid-task to write this because two new planning documents (`NOISEFLOOR-AUTHORING-PLAN.md`, `NOISEFLOOR-INTEGRATION-PLAN.md`) appeared in the repo while I was building, and one of them explicitly asks to change what "Phase 0" contains — see **§Conflict to resolve** below before I go further.

## What exists right now

### Planning docs (all at repo root)
- `NOISEFLOOR-OUTLINE.md` — v1 founding brief (pre-existing, unchanged by me).
- `PROJECT-PLAN.md` — delivery plan/decision log/risk register I wrote earlier this session (unchanged since).
- `NOISEFLOOR-AUTHORING-PLAN.md`, `NOISEFLOOR-INTEGRATION-PLAN.md` — **new, not written by this session** — appeared during this build. I've read both in full (see below).
- HTML/PDF exports of the outline and project plan (untracked, cosmetic, ignorable).

### openspec
- `openspec/config.yaml` — initialized, with project context filled in.
- `openspec/changes/phase-0-foundation/` — proposal.md, design.md, tasks.md, and three delta specs (`case-content-schema`, `series-generators`, `magic-link-auth`) — all written, all validated (`openspec validate --changes phase-0-foundation --strict` passes). **Not yet archived** — Phase 0 isn't fully done (web/DNS remain).
- `sreditor` CLI installed globally, `.sreditor/` present (gitignored).

### `packages/shared` — done, tested, green
Zod schemas for `Case`/`World`/`Stage`/`Evidence`/`Prompt`/`Rubric`/`Debrief`/`Gotcha`, a seeded RNG (mulberry32), and all five series generators (`diurnalUsage`, `noisyCeiling`, `foliageYear`, `shaperCollapse`, `pinglogMonth`) plus `resolveSeriesRef`/`resolvePinglogRef`. 24 unit tests, all passing. `pnpm lint` / `pnpm typecheck` / `pnpm test` all clean at the repo root.

**Design decisions made while implementing that aren't written down anywhere else yet:**
- `Prompt.options` carries only `{id, label}` — no score/feedback. Scoring lives entirely on `Rubric` (`{kind:"options", scores:[{optionId,score,feedback}]}` or `{kind:"freeText", criteria:{mustMention,mustNotMention,bonus}}`), so a Stage's `Prompt` is safe to hand to the client pre-commit while `Rubric` never leaves the server — this is how outline §11's "rubrics never leave the server" is actually structurally enforced.
- `Evidence.family` enum already includes `"device"` alongside `crm`/`radio`/`nms` (PROJECT-PLAN.md decision D9), even though `packages/dashboards`' device components don't exist until Phase 5 — cheap to add now, avoids a later breaking schema change.
- `Branch` (optional deeper-dive) is a lighter shape than `Stage`: `{id, title, description?, rubric}` — no multi-stage reveal, since outline §9's branch examples read as single-question deep dives, not full stages.
- `SeriesPoint.t` is a plain string label ("HH:MM" for 24h/1h series, "MM-DD" for the 1y series) — no real dates/years anywhere, matching how the outline itself references dates (case 001's "05-24", "10-20").
- `pinglogMonth` produces a day × 10-minute-bucket grid (not per-minute — 4,320 cells instead of 43,200) to keep it generator-cheap; `bucketMinutes` is a parameter if finer resolution is ever needed.

### `apps/api` — built, deployed, verified live
Fastify 5 app (`app.ts`/`index.ts`/`env.ts`), Better Auth with the `magicLink` plugin + Drizzle Postgres adapter, mirroring `kerfy`'s `auth.ts` pattern exactly (cross-subdomain cookie logic keyed to `noisefloor.ca`, Resend delivery with a console-log fallback in `lib/send-magic-link.ts`). Auth schema (`user`/`session`/`account`/`verification`) in `db/auth-schema.ts`, migration generated and committed to `apps/api/drizzle/`.

**Deployed to Railway** (project `noisefloor`, id `1f78ffa6-6374-4f99-9745-c2e45e4e7760`):
- Postgres service provisioned (service id `1cbf60d4-fdf6-4aa3-aabf-af1724fb6d7a`).
- `api` service (id `b1df0ade-697f-4221-a001-5c6b7a1cca96`) deployed successfully, live at `https://api-production-153a.up.railway.app` — `/health` verified returning `{"status":"ok"}`.
- Better Auth's migration run against the live Railway Postgres via a private SSH tunnel (not a public proxy — nothing was exposed to the internet); confirmed all four tables exist.
- A magic-link request against the live API (`POST /api/auth/sign-in/magic-link`) returned `200 {"status":true}`. I was mid-way through pulling the console-logged link out of Railway's runtime logs to finish verifying the full round-trip (spec scenarios in `magic-link-auth/spec.md`) when this got paused.
- Env vars set on `api`: `DATABASE_URL` (wired via Railway variable reference), `BETTER_AUTH_SECRET` (generated, not recorded in any file — Railway-side only), `BETTER_AUTH_URL` (set to the Railway domain above), `WEB_URL` (placeholder `http://localhost:5173`, needs updating once Vercel exists), `NODE_ENV`, `RESEND_FROM_EMAIL`. `RESEND_API_KEY` intentionally unset (console-log fallback active).

### `apps/web` — scaffolded, not deployed
React 19 + Vite 8 + React Router 8 + Tailwind v4, mirroring `kerfy`'s `apps/dashboard`. Sign-in page (magic-link request form), a minimal authenticated "hello" page, `RequireAuth` route guard, Better Auth client wired. **Not yet run against the live API, not yet deployed to Vercel.**

### `packages/dashboards`, `packages/cases`
Empty placeholders (`export {}`) with a comment noting they're intentionally deferred to Phase 1/Phase 2. No component or case content written yet.

### Not done from `openspec/changes/phase-0-foundation/tasks.md`
- 5.3: finish verifying the magic-link round trip (grab the logged link, hit the verify endpoint, confirm session creation; also check expired/reused-link rejection).
- 6.2: exercise the local sign-in round-trip in `apps/web` against a running API.
- 8.1–8.3: Vercel deploy, DNS cutover to `noisefloor.ca`/`api.noisefloor.ca`, re-point `WEB_URL`/`BETTER_AUTH_URL`/`trustedOrigins` at real domains and re-verify cross-subdomain cookies there (not just the Railway temp domain).
- 9.1/9.2: final full-suite re-run and spec-scenario checklist, then archive the openspec change.

## Conflict to resolve before I continue

`NOISEFLOOR-AUTHORING-PLAN.md` §11 point 1 says: *"**Phase 0:** add the World consistency validator (§3)... Pull it into Phase 0 of the outline."* That's a real, structural addition to the same `World` schema I've already written and already deployed against (Better Auth's tables are live on Railway; the `World`/`Case` Zod schemas in `packages/shared` are done and tested as originally scoped in `openspec/changes/phase-0-foundation/specs/case-content-schema/spec.md`, **without** a validator).

Two things are in tension inside the authoring plan itself:
- §11.1 says the validator belongs in Phase 0.
- §12's own "Sequencing rule" says *"resist the builder as long as possible... Order: validator → cases → player → prove people finish → then open the toggles"* — which reads as validator-before-cases-content but doesn't obviously mean validator-before-the-workspace-and-auth-scaffold I'm mid-way through.

I did not add the validator. Reasonable paths, not my call to pick silently:
1. **Treat "Phase 0" in the authoring plan loosely** — finish this Phase 0 (schema + generators + auth + deploy, no validator) as originally scoped, and add the validator as the first item of whatever comes next (Phase 1, or a new phase before Phase 1). Lowest disruption to what's already deployed and tested.
2. **Actually retrofit the validator into this Phase 0** before calling it done — would mean amending the `phase-0-foundation` openspec change (new capability + spec + tasks) and likely touching the `World` schema/tests I already wrote, before archiving anything.
3. Something in between (e.g., validator lands as its own immediately-following openspec change, but before Phase 1's dashboard work starts, so no dashboard ever renders an un-validated `World`).

I've paused rather than guessing. Also worth the web session and Robin knowing: the authoring/integration plans introduce several other Phase-0-adjacent structural changes (e.g., `Case.author`/`visibility`/`version` fields, `Prompt` gaining a `findTheFault` kind, generated-not-typed identity fields) that would also touch the schema I already built — worth deciding as a batch rather than one at a time.

## Everything else, for context

- Git: nothing committed yet this session. `git status` shows the entire scaffold as untracked, per D6 ("commit and push as we go") this is overdue but I held off until the schema-stability question above is settled, so I'm not committing something that immediately needs amending.
- Railway/Vercel CLIs are both already authenticated (`rgsamways@gmail.com`) — no login needed from Robin for infra work.
- Local Postgres exists on this machine (system service, port 5432) but I don't have its credentials and deliberately didn't go looking for them in other projects' `.env` files — all DB verification happened directly against Railway's real Postgres instead (see `apps/api — built, deployed, verified live` above).
