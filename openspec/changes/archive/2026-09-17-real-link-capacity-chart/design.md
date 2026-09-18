## Context

See `proposal.md`. The stub chart (`packages/dashboards/src/crm/LinkCapacityChart.tsx`) exists and is visually reasonable (built to match `homepage/DESIGN-NOTES.md`) — this change keeps its visual language but replaces its data source and adds the behavior outline §7 actually specifies for this component (period selector, signal trace panel, package-limit line, annotations).

## Goals / Non-Goals

**Goals:**
- Real data wiring via `resolveSeriesRef`, deterministic under a seed.
- The specific behaviors outline §7 names for this component: period selector, signal trace panel, optional package-limit line, annotation support.
- Start the `packages/dashboards/src/primitives/` layer outline §7 specifies, rather than inlining SVG/div markup a second time.
- A `/dev/gallery` route to develop and visually check the component against reference screenshots, and a first Playwright visual snapshot.

**Non-Goals:**
- No other `crm`/`radio`/`nms` components — outline §13 scopes Phase 1 to this one component deliberately ("the one component that matters"); the rest is Phase 3.
- No pixel-perfect match against real vendor screenshots — decision D4's reference screenshots (vendor public demos) aren't in hand for this change; the visual snapshot this change adds is a regression baseline against itself, not a fidelity grade against a vendor original. Revisit fidelity once reference screenshots exist.
- No case-content integration (`packages/cases` is still empty) — the gallery route feeds the chart hand-built `World` fixtures using case-001-shaped parameters, not an actual authored case.

## Decisions

**Component signature: `LinkCapacityChart({ world, seed, annotations?, packageLimitMbps? })`.** Alternative considered: pass already-resolved series arrays as separate props instead of a `World` + seed. Rejected: outline §4's architecture is "dashboards are components, cases are data" — a dashboard taking a `World` (or a slice of one) and a seed is the pattern every other `crm`/`radio`/`nms` component will follow, so this component should establish it rather than take a special-cased shape. `packageLimitMbps` defaults from `world.customer.plan.down` when omitted, per the spec.

**Primitives are minimal and specific, not a generic charting abstraction.** `StackedBars` and `LineTrace` in `packages/dashboards/src/primitives/` cover exactly what this component needs (a bar column with two stacked segments; a line trace over labelled points) — not a configurable do-everything chart engine. Per decision D12, the whole point of hand-rolled primitives is staying in control of "looks like the real tool" fidelity; over-abstracting them now, before a second consumer (Phase 3's `radio`/`nms` components) exists to validate the abstraction, would be guessing at requirements that don't exist yet.

**Annotation type lives in `packages/shared`, not `packages/dashboards`.** It's data (`{ target: { series, t }, label }`), consumed by any dashboard component, and cases will eventually author annotations as part of their debrief content (outline §5.6/§9) — it belongs with the rest of the case-content schema, not scoped to one component's package.

**`/dev/gallery` is excluded from production builds via a route-level check, not a separate build target.** Outline §8 lists it explicitly as "dev only, not deployed to prod." Simplest approach for a Vite SPA: gate the route registration on `import.meta.env.DEV`, so it's tree-shaken out of the production bundle without needing a second Vite config or build pipeline.

**Playwright visual snapshot runs against the gallery route, not the landing page.** The gallery route is the stable, purpose-built surface for this (case-001-shaped fixture data, no auth, no network dependency on a live API) — the landing page pulls in unrelated content (hero copy, nav) that would make the snapshot fragile to unrelated changes.

## Risks / Trade-offs

- **[Risk] Visual snapshot baselines drift without real vendor reference to check against.** → **Mitigation**: explicitly scoped as a non-goal (see above) — the snapshot catches *regressions*, not *inaccuracy*; a fidelity pass against real references is separate, later work once D4's screenshots exist.
- **[Risk] Introducing `packages/dashboards/src/primitives/` before a second component exists to validate the abstraction could guess wrong.** → **Mitigation**: kept deliberately narrow (two primitives, exactly what this component uses) rather than speculative; expect to revise once Phase 3's `radio`/`nms` components are the second real consumer.

## Migration Plan

The stub's file path (`packages/dashboards/src/crm/LinkCapacityChart.tsx`) is kept — this change replaces its contents, not its location, per the stub's own comment ("replace the internals wholesale... keep the file at this path"). `Landing.tsx`'s usage updates in the same change to match the new prop signature.
