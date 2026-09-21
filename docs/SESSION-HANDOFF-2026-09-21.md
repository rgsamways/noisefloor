# Session handoff — 2026-09-21 (terminal session, post-pivot)

**Status:** nothing in this session has been committed to git yet — see "Uncommitted state" below. No code was written; this session was pivot housekeeping plus a design-direction pass. Read `/README.md` first for the always-current orientation, then this doc for what specifically happened today.

## What this session did

Picked up from `docs/NOISEFLOOR-CONSOLE-HANDOFF.md` (the claude.ai session's pivot doc from the same day) and did three things:

**1. Parked the case-study product, cleanly, without deleting anything.** `PROJECT-PLAN.md`, `NOISEFLOOR-OUTLINE.md`, `NOISEFLOOR-AUTHORING-PLAN.md`, `NOISEFLOOR-INTEGRATION-PLAN.md`, and 9 openspec specs (`attempt-scoring`, `case-content-schema`, `case-player-api`, `crm-dashboard`, `link-capacity-chart`, `nms-dashboard`, `radio-dashboard`, `series-generators`, `world-consistency-validator`) each got a "Parked" banner pointing at the handoff doc. `PROJECT-PLAN.md` got a new append-only D16 decision entry. `openspec/config.yaml`'s project context was rewritten so future `openspec propose` calls know the console is current and the case-study docs are parked — this file feeds every proposal, so leaving it stale would have caused exactly the kind of scope confusion Robin flagged from past projects. Deleted `STATUS.md` (an explicitly-marked non-durable sync doc, fully stale) and the superseded `openspec/changes/radio-link-view/` proposal (its one reusable finding — Meridian's confirmed UISP field names — was carried forward into the new proposal below before deleting it). Added a root `README.md` and package-level README notes (`packages/cases`, `packages/shared`, `packages/dashboards`) as the actual "what's active vs. parked" reference — that's the file to trust over memory of this conversation.

**2. Stubbed the first real console capability.** `openspec/changes/radio-console-schema/` — proposal, design, tasks, and a spec delta for the normalized radio-link + service-layer + staleness + link-profile schema (handoff doc §4–§6). Validated clean (`openspec validate --changes radio-console-schema --strict`). **Deliberately not implemented** — 0/17 tasks — scoped narrow on purpose (schema only, no simulation engine, no UI, no vendor driver) so it can go through a review pass with Robin before anything is built on top of it. This is the right starting point for the next session's actual build work, once reviewed.

**3. Settled the console's visual direction.** Robin asked for something "futuristic... built a few years from now," open on color. Four static HTML mockups compared material/color direction (no repo code touched): HUD/instrument-panel, glassmorphism, minimal-one-accent, and a hybrid. **Robin picked the hybrid** — HUD's crisp dark foreground + glass's background glow + a severity-based color scale (good/ok/warn/bad) applied consistently across every judged reading. Robin then caught that none of the four were responsive and asked for a mobile pass; a fifth mockup (phone-frame, stacked columns, bottom tab nav) was built and approved. Full writeup, style tokens, and the "why" behind picking HUD over glass: `docs/CONSOLE-VISUAL-DIRECTION.md`. All five mockups live in `docs/mockups/` for reference — they're throwaway static HTML, not real components, but they're the concrete visual contract for whoever builds the first real console component.

## Uncommitted state

Everything above is sitting in the working tree, uncommitted (`git status --short` shows the full list). Robin hasn't asked for a commit yet this session — check with him before committing, per this repo's own git-safety norms, rather than assuming.

## What NOT to do without checking first

- Don't start implementing `radio-console-schema` (or the simulation engine / console UI that would follow it) without a review pass with Robin first — he explicitly asked for "a few passes over it together" on the schema, and this session's own retrospective (see memory: a prior evening spiraled badly from reading an ambiguous go-ahead as authorization for a full build).
- Don't touch the parked case-study code/docs/specs unless Robin explicitly asks to resume that line of work — the parking was a deliberate, considered decision, not a default to second-guess.
- Two forward-looking product ideas were raised but explicitly not designed yet: an invite-gated private area behind a public no-login front door, and a possible future expansion beyond fixed-wireless into a general IT-craft hub. Both are saved to memory (`project-noisefloor-access-model-idea`, `project-noisefloor-multi-craft-expansion-idea`) — keep architecture/naming loose enough to accommodate them later, but don't design for them now.

## Where everything lives

- Current direction, at a glance: `/README.md`
- Product/technical pivot spec: `docs/NOISEFLOOR-CONSOLE-HANDOFF.md`
- Visual direction + style tokens + mobile requirement: `docs/CONSOLE-VISUAL-DIRECTION.md`
- Reference mockups (not real code): `docs/mockups/`
- First buildable proposal, unimplemented, ready for review: `openspec/changes/radio-console-schema/`
- Decision record: `PROJECT-PLAN.md` D16 (and D1–D15 for everything before the pivot)
- Cross-session memory: search for `project-noisefloor-console-pivot` and the memories it links to
