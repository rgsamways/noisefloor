## 1. Annotation type (packages/shared)

- [x] 1.1 Add `AnnotationSchema`/`Annotation` type in `packages/shared/src/schemas/annotation.ts` (`{ target: { series: string; t: string }, label: string }`), exported from the package barrel; verify `pnpm --filter @noisefloor/shared typecheck` passes and a unit test validates a well-formed annotation

## 2. Chart primitives (packages/dashboards)

- [x] 2.1 Add `packages/dashboards/src/primitives/StackedBars.tsx`: renders a column of bars, each with a "used"/"remaining" stacked split, given resolved `SeriesPoint[]` pairs; verify it renders the expected number of bar elements for a given input
- [x] 2.2 Add `packages/dashboards/src/primitives/LineTrace.tsx`: renders a line trace over resolved `SeriesPoint[]`; verify it renders for both the 24h (many points) and 1y (fewer, wider-spaced points) shapes

## 3. Real LinkCapacityChart

- [x] 3.1 Replace the stub's internals: accept `{ world: World; seed: string | number; annotations?: Annotation[]; packageLimitMbps?: number }`; resolve `capacityDown24h`/`usedDown24h` via `resolveSeriesRef` and render via `StackedBars`; verify changing `world.series.capacityDown24h` changes the rendered output with no code change
- [x] 3.2 Add the period selector (24h / 1y); 1y mode resolves and renders `capacityDown1y` via `LineTrace` instead of `StackedBars`; verify switching period swaps the rendered chart type and time-axis labels
- [x] 3.3 Add the signal trace panel beneath, switching between `signalTrace24h`/`signalTrace1y` to match the active period; verify it tracks the period switch
- [x] 3.4 Add the package-limit line, defaulting to `world.customer.plan.down` when `packageLimitMbps` isn't supplied; verify the default and an explicit override both render correctly
- [x] 3.5 Add annotation rendering: a callout positioned at the matching series+timestamp point; verify an annotation targeting a known point renders its label at that point — found a real gotcha while wiring the gallery fixture: annotations must match an *actual generated point label* exactly, and `foliageYear` steps every 3 days, so not every calendar date (e.g. the `leafOnDate` parameter itself) lands on a real point. Not fixed in this change (would mean either changing the generator's step size or adding nearest-point matching to the renderer) — flagged as a follow-up, since it'll trip up whoever authors case content's annotations next
- [x] 3.6 Verify determinism: same `world` + seed renders identical output across two render passes

## 4. Dev gallery route (apps/web)

- [x] 4.1 Add `/dev/gallery` in `apps/web`, gated on `import.meta.env.DEV` so it's excluded from production builds; verify the route is present in a dev build and absent from a production build's router — confirmed via `pnpm exec vite build` + grepping the output bundle for `DevGallery`/`dev/gallery`: zero matches
- [x] 4.2 Build a case-001-shaped `World` fixture in the gallery route using the real generators (`foliageYear` for `signalTrace1y`, `noisyCeiling`/`diurnalUsage` for the 24h series) with parameters from `NOISEFLOOR-OUTLINE.md` §9, feeding the real `LinkCapacityChart`; verify it renders both periods and at least one annotation — found a real gap in the process: there's no year-scale ("MM-DD"-labelled) capacity generator in `@noisefloor/shared` yet (`noisyCeiling` only produces 24h-shaped, "HH:MM"-labelled points) — `capacityDown1y` uses inline hand-authored points instead. Building a real generator for this is legitimate future work, just not this change's scope

## 5. Landing page integration

- [x] 5.1 Update `apps/web/src/pages/Landing.tsx` to build a small `World`-shaped fixture (reusing the same case-001-shaped parameters as the gallery) and pass it to the real `LinkCapacityChart`, removing the stub's internal fixed-array dependency; verify the landing page still renders correctly (re-run the `homepage-landing` spec scenarios) — verified visually via Playwright screenshot; the fixture is shared between `Landing.tsx` and `DevGallery.tsx` via `apps/web/src/lib/gallery-world.ts` rather than duplicated

## 6. Visual regression

- [x] 6.1 Add `playwright` as a dev dependency of `apps/web` (not present until now); verify `pnpm --filter @noisefloor/web exec playwright --version` runs — used `@playwright/test` (the test-runner package) rather than bare `playwright`, since the goal is `playwright test` + `toHaveScreenshot()`, which bare `playwright` doesn't provide
- [x] 6.2 Add a Playwright visual snapshot test navigating to `/dev/gallery` and snapshotting the chart in both periods; verify the test passes on first run (establishing the baseline) and again unchanged (confirming stability) — both confirmed; config uses `channel: "chrome"` to reuse the system-installed Chrome instead of downloading Playwright's own bundled browser

## 7. Verification

- [x] 7.1 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` at the repo root; verify all three pass — 46 tests passing, lint and typecheck clean across all packages
- [x] 7.2 Confirm every scenario in `specs/link-capacity-chart/spec.md` has a passing corresponding test — confirmed via a mix of unit tests (primitives, determinism) and the Playwright visual/interaction checks (period switch, annotation, package-limit default) run manually against the live dev server
