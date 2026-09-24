## Context

See proposal.md - Why. Relevant existing shapes (`packages/simulation-engine/src/simulate.ts` and `service-layer.ts`):

```ts
type SimulationConfig = {
  linkProfile: LinkProfile;
  seed: string;
  baseTimeIso: string;
  baseUptimeSeconds?: number;
  scenario?: Scenario; // = { faults?: FaultDefinition[] }
};

type ServiceLayerConfig = {
  baseTimeIso: string;
  scenario?: ServiceLayerScenario; // = { faults?: ServiceLayerFault[] }
};
```

`apps/web/src/lib/demo-link-telemetry.ts` currently has `useDemoConfigs()` build one static `{ local, remote, serviceLayer }` config triple, and `useDemoLinkTelemetry()` runs the 1Hz tick against it. `Landing.tsx` (homepage) and `Console.tsx` both call `useDemoLinkTelemetry()` today with identical behavior.

## Goals / Non-Goals

**Goals:**
- Let `/console` swap between 10 pre-built named scenarios live, reusing the existing tick loop.
- Leave the homepage's demo untouched — same call site, same behavior, zero risk of regression there.

**Non-Goals:**
- No new fault factories or simulation-engine behavior — this change only composes what already exists in `packages/simulation-engine`.
- No persistence of the selected scenario (URL param, localStorage) — plain component state, resets to the default on page load.
- No changes to `LinkPanel`/`ServiceLayerPanel` component props or rendering logic.

## Decisions

**Scenario definitions live in `apps/web/src/lib/console-scenarios.ts`, not `packages/simulation-engine`.** This is a specific arrangement of existing engine primitives for one demo UI, not general-purpose simulation behavior — it belongs next to `demo-link-telemetry.ts`, the file it replaces the hardcoded scenario in. Alternative considered: add it to `packages/dashboards` since that's the console's component package — rejected because `dashboards` has no existing dependency on `simulation-engine` (`LinkPanel`/`ServiceLayerPanel` take already-computed telemetry as props, not configs), and this change shouldn't introduce one.

**Each scenario is `{ label: string; local: Partial<SimulationConfig>; remote: Partial<SimulationConfig>; serviceLayer: Partial<ServiceLayerConfig> }`, merged onto the same base `linkProfile`/`seed`/`baseTimeIso` values `useDemoConfigs` uses today.** Avoids repeating `linkProfile`/`seed` boilerplate across 10 definitions; each scenario only needs to specify what's different (a fault list, or `baseUptimeSeconds` for Wrong Boot Order). Alternative considered: fully-specified `SimulationConfig` per scenario — rejected as repetitive and more error-prone (easy to accidentally vary `distanceKm`/`band` between scenarios with no reason to).

**`useDemoLinkTelemetry` takes an optional `scenarioKey` parameter, defaulting to the same scenario shown today (Foliage Growth on LOCAL).** `Landing.tsx` keeps calling it with no argument, so the homepage's rendered output is provably unchanged. `Console.tsx` holds `useState<ScenarioKey>` for the current selection (defaulting to the same value) and passes it in. Alternative considered: defaulting `/console` to "Healthy" on load — rejected because it'd change what every first-time visitor to `/console` sees today without a reason tied to this change's scope; the picker adding *options* shouldn't change the *default*.

**The picker is a plain styled `<select>`, mounted in `Console.tsx` above `LinkPanel`.** Matches the "dropdown/select" decision from design conversation; a native select needs no new dependency and is trivially accessible. Styling reuses the HUD color tokens already defined in `LinkPanel.tsx`/`ServiceLayerPanel.tsx` (`ACCENT`, `LINE`, `TEXT`, etc.) rather than introducing a new component-level palette.

**`ScenarioKey` is a string-literal union of the 10 names**, and the scenario map is a `Record<ScenarioKey, ScenarioDefinition>` — exhaustive by construction, so adding or removing a scenario is a compile error anywhere it's not handled (e.g. the `<select>`'s option list), rather than a silent gap.

## Risks / Trade-offs

- **[Risk] Cable Degradation's severity badge stays green, which could read as "the picker is broken" to a visitor with no other context.** → Mitigation: none added by this change — per the design conversation, this is accepted as realistic (some real degradation genuinely doesn't trip a top-level alarm) and deliberately shipped as-is rather than patched with an explanatory callout, matching the spec's explicit requirement.
- **[Risk] Duplicating the "which side gets which config" logic between the scenario map and `useDemoConfigs`'s merge step could drift if edited carelessly later.** → Mitigation: `ScenarioDefinition`'s shape (`Partial<SimulationConfig>` per side) and a single merge function in `useDemoConfigs` keep the merge logic in one place; scenario definitions never touch `simulateRadioLink`/`simulateServiceLayer` directly.
- **[Trade-off] Named bundled presets (this change) can't express arbitrary LOCAL+REMOTE+service-layer combinations.** → Accepted per the design conversation: independent-per-panel selection was explicitly ruled out because most combinations wouldn't tell a coherent story; revisit only if a real need for mixing surfaces later.
