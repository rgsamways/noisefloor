## 1. Scenario data module

- [x] 1.1 Create `apps/web/src/lib/console-scenarios.ts` defining a `ScenarioKey` string-literal union (the 10 names), a `ScenarioDefinition` type (`{ label; local: Partial<SimulationConfig>; remote: Partial<SimulationConfig>; serviceLayer: Partial<ServiceLayerConfig> }`), and a `Record<ScenarioKey, ScenarioDefinition>` covering all 10 scenarios from proposal.md, built from existing fault factories in `packages/simulation-engine`. Verify with `pnpm --filter web exec tsc --noEmit`.
- [x] 1.2 Add a Vitest unit test for the scenario module verifying: all 10 keys are present, each radio-link fault scenario's fault sits on `local` (not `remote`), Wrong Boot Order sets both a service-layer fault and a low `local.baseUptimeSeconds`, and Healthy has no faults anywhere. Verify with `pnpm -w test`.

## 2. Wire scenario selection into the demo hook

- [x] 2.1 Update `useDemoConfigs`/`useDemoLinkTelemetry` in `apps/web/src/lib/demo-link-telemetry.ts` to accept an optional `scenarioKey: ScenarioKey` parameter (defaulting to the scenario matching today's hardcoded demo, i.e. Foliage Growth on LOCAL), merging the selected `ScenarioDefinition` onto the existing base `linkProfile`/`seed`/`baseTimeIso` values. Verify `Landing.tsx`'s existing no-argument call site still typechecks unchanged.
- [x] 2.2 Verify the homepage's rendered demo is unaffected: load `/` before and after this change and confirm the hero panel shows the same scenario (same fault, same severity).

## 3. Console picker UI

- [x] 3.1 Add a scenario `<select>` control to `Console.tsx`, styled with `LinkPanel.tsx`'s existing HUD color tokens, backed by local `useState<ScenarioKey>` defaulting to the same value as the hook's default. Verify by loading `/console` and confirming the control lists all 10 scenario names.
- [x] 3.2 Verify selecting each of the 10 scenarios updates both `LinkPanel` and `ServiceLayerPanel` without a page reload, and matches its spec requirement (e.g. Wrong Boot Order shows a healthy-but-low-uptime LOCAL column alongside a down service layer; Cable Degradation shows widened chain meters with an unchanged GOOD severity badge).

## 4. Full verification

- [x] 4.1 Run `pnpm -w test` and `pnpm --filter web exec tsc --noEmit`, confirm both pass with no regressions.
- [x] 4.2 Load `/console` in a real browser, cycle through all 10 scenarios, and confirm each renders distinctly as specified.
- [x] 4.3 Load `/` in a real browser and confirm the homepage demo still shows its original fixed scenario, unaffected by this change.
