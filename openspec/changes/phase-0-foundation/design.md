## Context

Greenfield repository — no code exists yet, only `NOISEFLOOR-OUTLINE.md` (product/technical spec) and `PROJECT-PLAN.md` (delivery plan, decision log D1–D12, risk register). This design covers Phase 0 only (`PROJECT-PLAN.md` §4): workspace, schemas, generators, auth, and a proving deploy. See `proposal.md` for why this phase exists and its capability list.

## Goals / Non-Goals

**Goals:**
- A pnpm workspace that mirrors `kerfy`'s root tooling exactly (decision D2), so there is zero convention drift between the two repos' contributor experience.
- `packages/shared` holding a complete, tested `Case`/`World`/`Stage` schema and the five series generators — the contract every later phase (case player, dashboards, case content) builds on.
- A deployed, working magic-link sign-in at `noisefloor.ca` — proof that the whole chain (DNS → Vercel → API on Railway → Postgres → Better Auth → Resend) works before any product feature is layered on it.

**Non-Goals:**
- No dashboard components (`packages/dashboards` stays empty) — that's Phase 1.
- No case player, case content, or scoring logic — that's Phase 2, and depends on the `attempts`/`stage_commits` tables which are *not* created in this phase (only auth tables are).
- No extension of `World` for the `device` family's profile/provisioning data (risk R4 in `PROJECT-PLAN.md`) — that extension belongs to Phase 5's own design, once the `device` family's actual data needs are scoped. Phase 0's `World` schema follows `NOISEFLOOR-OUTLINE.md` §5.2 as written, RF-only.

## Decisions

**Workspace layout mirrors `kerfy` file-for-file where possible.** Root `tsconfig.base.json`, `eslint.config.js`, `vitest.config.ts`, and each package's `tsconfig.json` are copied from `kerfy` with only naming changed (`@noisefloor/*` instead of `@kerfy/*`, `apps/web` instead of `apps/dashboard` per `NOISEFLOOR-OUTLINE.md` §6). Alternative considered: design fresh config from scratch — rejected, since decision D2 explicitly picked "mirror kerfy" for zero ramp-up, and there's no reason to diverge before any noisefloor-specific need appears.

**`packages/shared` has no React and no DB dependency**, matching `NOISEFLOOR-OUTLINE.md` §6 — it exports Zod schemas, inferred types, the seeded RNG, and the five generator functions as pure functions. This keeps it unit-testable in isolation and importable from both `apps/api` (server-side validation) and `apps/web` (client-side type-checking) without pulling either's runtime into the other.

**Seeded RNG**: a small, dependency-free mulberry32 (or equivalent) PRNG seeded from the case's `id` (or an explicit seed field), rather than pulling in a random-number library. Rationale: the only requirement is determinism (spec requirement "Generators are deterministic under a seed"), not cryptographic quality or a particular distribution — a ~10-line implementation avoids an external dependency for something this small.

**Auth mirrors `kerfy`'s `auth.ts`/`send-magic-link.ts` structure exactly** (decision D5): Better Auth's `magicLink` plugin, Drizzle Postgres adapter, Resend for delivery with a console-log fallback when `RESEND_API_KEY` is unset, and the same cross-subdomain-cookie logic keyed off whether `BETTER_AUTH_URL`'s host ends in the parent domain (`noisefloor.ca` here, `kerfy.ca` there) — same `sameSite: "none", secure: true` fallback for non-subdomain deploys (e.g. a bare `*.up.railway.app` URL before DNS is cut over). noisefloor does **not** need `kerfy`'s `customSession`/company-resolution/`kerfyAdmin` additions — those are kerfy's multi-tenant concerns and have no noisefloor equivalent at this phase (no additional session fields needed yet).

**Database migration order**: only Better Auth's own tables (`user`/`session`/`account`/`verification`) are created in Phase 0. The product tables (`attempts`, `stage_commits`, `gotcha_progress` — `NOISEFLOOR-OUTLINE.md` §10) are deliberately deferred to Phase 2, since they depend on the case engine's shape, which doesn't exist yet — creating them now risks a schema guess that gets migrated away before it's ever used.

**Deploy sequencing**: Railway (API + Postgres) is stood up and reachable before Vercel (web) is pointed at it, since the web app's magic-link flow needs a working API URL to call. DNS for `noisefloor.ca` (apex → Vercel) and `api.noisefloor.ca` (→ Railway) is the last step, after both services work on their platform-issued temporary domains — this avoids debugging DNS and application wiring at the same time.

## Risks / Trade-offs

- **[Risk] Cross-subdomain cookie misconfiguration silently breaks sign-in** (this exact failure mode already happened once in `kerfy` — missing `secure: true` alongside `SameSite=None` silently dropped the cookie) → **Mitigation**: copy `kerfy`'s already-debugged `auth.ts` logic verbatim, adapted only for the domain string; verify with an actual cross-subdomain request (web → api) before considering Phase 0 done, not just a same-origin localhost test.
- **[Risk] DNS propagation delay stalls "done" criteria** → **Mitigation**: verify the deploy against Railway's and Vercel's platform-issued temporary domains first; DNS cutover is the last step and doesn't block verifying the rest of the chain works.
- **[Risk] Resend requires a verified sending domain for `noisefloor.ca` before real emails send** → **Mitigation**: the console-log fallback (no `RESEND_API_KEY` set) is sufficient to verify the magic-link flow end-to-end in this phase; wiring a verified Resend domain can happen in parallel with, not blocking, the rest of Phase 0.

## Migration Plan

Nothing to migrate — this is the first deploy of a new repository. Rollback, if the deploy proves broken, is simply not pointing DNS at it yet (the temporary Railway/Vercel domains are the safe testing ground before `noisefloor.ca` is cut over).
