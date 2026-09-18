## 1. Annotation type (packages/shared)

- [ ] 1.1 Add `AnnotationSchema`/`Annotation` type in `packages/shared/src/schemas/annotation.ts` (`{ target: { series: string; t: string }, label: string }`), exported from the package barrel; verify `pnpm --filter @noisefloor/shared typecheck` passes and a unit test validates a well-formed annotation

## 2. Chart primitives (packages/dashboards)

- [ ] 2.1 Add `packages/dashboards/src/primitives/StackedBars.tsx`: renders a column of bars, each with a "used"/"remaining" stacked split, given resolved `SeriesPoint[]` pairs; verify it renders the expected number of bar elements for a given input
- [ ] 2.2 Add `packages/dashboards/src/primitives/LineTrace.tsx`: renders a line trace over resolved `SeriesPoint[]`; verify it renders for both the 24h (many points) and 1y (fewer, wider-spaced points) shapes

## 3. Real LinkCapacityChart

- [ ] 3.1 Replace the stub's internals: accept `{ world: World; seed: string | number; annotations?: Annotation[]; packageLimitMbps?: number }`; resolve `capacityDown24h`/`usedDown24h` via `resolveSeriesRef` and render via `StackedBars`; verify changing `world.series.capacityDown24h` changes the rendered output with no code change
- [ ] 3.2 Add the period selector (24h / 1y); 1y mode resolves and renders `capacityDown1y` via `LineTrace` instead of `StackedBars`; verify switching period swaps the rendered chart type and time-axis labels
- [ ] 3.3 Add the signal trace panel beneath, switching between `signalTrace24h`/`signalTrace1y` to match the active period; verify it tracks the period switch
- [ ] 3.4 Add the package-limit line, defaulting to `world.customer.plan.down` when `packageLimitMbps` isn't supplied; verify the default and an explicit override both render correctly
- [ ] 3.5 Add annotation rendering: a callout positioned at the matching series+timestamp point; verify an annotation targeting a known point renders its label at that point
- [ ] 3.6 Verify determinism: same `world` + seed renders identical output across two render passes

## 4. Dev gallery route (apps/web)

- [ ] 4.1 Add `/dev/gallery` in `apps/web`, gated on `import.meta.env.DEV` so it's excluded from production builds; verify the route is present in a dev build and absent from a production build's router
- [ ] 4.2 Build a case-001-shaped `World` fixture in the gallery route using the real generators (`foliageYear` for `signalTrace1y`, `noisyCeiling`/`diurnalUsage` for the 24h series) with parameters from `NOISEFLOOR-OUTLINE.md` §9, feeding the real `LinkCapacityChart`; verify it renders both periods and at least one annotation

## 5. Landing page integration

- [ ] 5.1 Update `apps/web/src/pages/Landing.tsx` to build a small `World`-shaped fixture (reusing the same case-001-shaped parameters as the gallery) and pass it to the real `LinkCapacityChart`, removing the stub's internal fixed-array dependency; verify the landing page still renders correctly (re-run the `homepage-landing` spec scenarios)

## 6. Visual regression

- [ ] 6.1 Add `playwright` as a dev dependency of `apps/web` (not present until now); verify `pnpm --filter @noisefloor/web exec playwright --version` runs
- [ ] 6.2 Add a Playwright visual snapshot test navigating to `/dev/gallery` and snapshotting the chart in both periods; verify the test passes on first run (establishing the baseline) and again unchanged (confirming stability)

## 7. Verification

- [ ] 7.1 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` at the repo root; verify all three pass
- [ ] 7.2 Confirm every scenario in `specs/link-capacity-chart/spec.md` has a passing corresponding test
