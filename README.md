# noisefloor.ca

Training for fixed-wireless ISP support technicians — learn to read the instruments, not memorize the answers.

## Current direction

**Phase one is a vendor-neutral radio console**, not the case-study product described in the older planning docs. Read [`docs/NOISEFLOOR-CONSOLE-HANDOFF.md`](docs/NOISEFLOOR-CONSOLE-HANDOFF.md) first — it's the current source of truth for what's being built and why.

The console: one screen, normalized to a vendor-neutral 21-field schema plus a service-layer panel, driven by a simulation engine in phase one and real vendor drivers behind the same schema in phase two. See the handoff doc for the schema, the simulation-engine design goals, and the vendor landscape research.

## Parked for phase one

The case-study product (curated cases, commit-before-reveal scoring, the `crm`/`radio`/`nms` dashboard families, the case-player) is real, working code — not deleted, just not the active line of work. It may resume in a later phase built on top of the console, per the handoff doc §1.

- `NOISEFLOOR-OUTLINE.md`, `NOISEFLOOR-AUTHORING-PLAN.md`, `NOISEFLOOR-INTEGRATION-PLAN.md`, `PROJECT-PLAN.md` — historical planning docs, each carries a banner pointing here.
- `openspec/specs/{attempt-scoring,case-content-schema,case-player-api,crm-dashboard,link-capacity-chart,nms-dashboard,radio-dashboard,series-generators,world-consistency-validator}/spec.md` — each carries a "Status: Parked" banner.
- `packages/cases`, `packages/shared/src/{schemas,scoring,validator,gen}`, `packages/dashboards/src/{crm,nms,radio}`, `apps/api/src/routes/{cases,attempts}.ts`, `apps/web/src/pages/{CasePlayer,Cases}.tsx` — parked code. See each package's README for specifics.

Not parked: `packages/dashboards/src/primitives` (chart/gauge/meter building blocks — reusable for the console UI), auth, landing page, deploy infra.

## Stack

pnpm workspaces; `apps/web` (React 19 + Vite + Tailwind v4 + React Router 8), `apps/api` (Fastify 5 + Drizzle + Postgres + Better Auth), `packages/shared`, `packages/dashboards`, `packages/cases`. Spec-driven via `openspec` — every feature is a proposal (`openspec/changes/`) before code.
