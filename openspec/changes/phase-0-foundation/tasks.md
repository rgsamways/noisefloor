## 1. Workspace scaffold

- [x] 1.1 Create root `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `eslint.config.js`, `vitest.config.ts`, `.gitignore` mirroring `kerfy`'s root config; verify `pnpm install` succeeds with zero packages yet
- [x] 1.2 Create `apps/web`, `apps/api`, `packages/shared`, `packages/dashboards`, `packages/cases` directories, each with a `package.json` and `tsconfig.json` extending the root config; verify `pnpm -r list` shows all five workspace packages

## 2. `packages/shared` — case content schema

- [x] 2.1 Add Zod schemas for `Case`, `World`, `Stage`, `Evidence`, `Prompt`, `Rubric`, `Debrief`, `Gotcha` per `NOISEFLOOR-OUTLINE.md` §5 and `specs/case-content-schema/spec.md`; verify a minimal valid case object parses and an invalid one (missing `world`) is rejected, both as unit tests
- [x] 2.2 Export inferred TypeScript types alongside each schema from `packages/shared/src/index.ts`; verify `pnpm --filter @noisefloor/shared typecheck` passes

## 3. `packages/shared` — seeded RNG and series generators

- [x] 3.1 Implement a seeded PRNG (mulberry32 or equivalent, no external dependency); verify two instances seeded identically produce the same sequence
- [x] 3.2 Implement `diurnalUsage`, `noisyCeiling`, `foliageYear`, `shaperCollapse`, `pinglogMonth` per `specs/series-generators/spec.md`; verify one unit test per generator covering its spec'd scenario
- [x] 3.3 Implement `SeriesRef` resolution (inline points vs. `{ gen, params }`) into a uniform `{ t, v }[]` shape; verify a test resolving both forms produces comparable output shape

## 4. `apps/api` — scaffold and health check

- [x] 4.1 Scaffold Fastify 5 app (`app.ts`, `index.ts`, `env.ts` with Zod-validated env vars) mirroring `kerfy`'s structure; verify `pnpm --filter @noisefloor/api dev` serves a `/health` route locally
- [x] 4.2 Add Drizzle + `pg` with a `DATABASE_URL` env var pointed at a local dev Postgres; verify `drizzle-kit` can connect (even with zero tables yet) — verified via `drizzle-kit generate` producing correct SQL structurally; live-connection verification happened directly against Railway's Postgres in 7.2 rather than a local instance, to avoid touching unrelated local Postgres credentials

## 5. `apps/api` — magic-link auth

- [x] 5.1 Add Better Auth with the `magicLink` plugin and Drizzle adapter, mirroring `kerfy`'s `auth.ts` (cross-subdomain cookie logic adapted to `noisefloor.ca`/`api.noisefloor.ca`, per `design.md`); verify Better Auth's own migration generates `user`/`session`/`account`/`verification` tables
- [x] 5.2 Add `send-magic-link.ts`: Resend delivery when `RESEND_API_KEY` is set, console-logged link otherwise, mirroring `kerfy`'s implementation; verify a local sign-in request logs a usable link when no key is set
- [x] 5.3 Verify the three magic-link auth spec scenarios locally: new-email sign-in creates a user, returning-email sign-in reuses it, and a reused/expired link is rejected — all verified live against the Railway deployment: new email created user `XyQHWS6SGpBgABOK4ZFxzNEDsOYC9Mgt`; a second sign-in for the same email reused that exact user id; reusing a consumed token redirected with `?error=INVALID_TOKEN` and no session cookie. Cross-subdomain cookie behavior (the fourth spec requirement) is verified after DNS cutover in 8.3, since it only applies once served from a real `noisefloor.ca` subdomain

## 6. `apps/web` — scaffold and sign-in page

- [ ] 6.1 Scaffold React 19 + Vite 8 + React Router 8 + Tailwind v4 app mirroring `kerfy`'s `apps/dashboard` structure; verify `pnpm --filter @noisefloor/web dev` serves a placeholder page locally
- [ ] 6.2 Add a sign-in page (email input → calls the API's magic-link request endpoint) and a minimal authenticated "hello" page; verify a full local sign-in round-trip (request link from console log → visit link → land on the authenticated page)

## 7. Deploy — Railway (API + Postgres)

- [x] 7.1 Provision a Railway project with a Postgres instance and the `apps/api` service; verify the API responds on its Railway-issued temporary domain — `https://api-production-153a.up.railway.app/health` returns `{"status":"ok"}`
- [x] 7.2 Run Better Auth's migration against the Railway Postgres instance; verify the auth tables exist in the deployed database — confirmed via `\dt` over an SSH tunnel: `account`, `session`, `user`, `verification` all present

## 8. Deploy — Vercel (web) and DNS

- [ ] 8.1 Provision a Vercel project for `apps/web`, pointed at the Railway API's temporary domain; verify the deployed web app serves the placeholder/sign-in page on its Vercel-issued temporary domain
- [ ] 8.2 Point `noisefloor.ca` (apex) at Vercel and `api.noisefloor.ca` at Railway via DNS; verify both resolve and serve correctly
- [ ] 8.3 Re-point the web app's API URL and Better Auth's `trustedOrigins`/`BETTER_AUTH_URL` at the final `noisefloor.ca`/`api.noisefloor.ca` domains; verify the cross-subdomain magic-link sign-in flow (spec requirement "session cookie usable across web and API subdomains") works end to end on the real domain, not just the temporary ones

## 9. Phase exit verification

- [ ] 9.1 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` at the repo root; verify all three pass with zero errors
- [ ] 9.2 Confirm every scenario in `specs/case-content-schema/spec.md`, `specs/series-generators/spec.md`, and `specs/magic-link-auth/spec.md` has a passing corresponding test or manual verification step, per `PROJECT-PLAN.md`'s Phase 0 deliverable
