## Why

`/console` currently plays exactly one hardcoded demo scenario (a CPE-side foliage-growth fault, everything else healthy). The fault catalog behind it is much richer — five radio-link fault signatures and four service-layer fault signatures, all already built and unit-tested in `packages/simulation-engine` — but none of it is visible to a real visitor. A visitor can't see what the console looks like under rain fade, a double NAT, or any other real fault shape. This proposal lets a visitor pick a named scenario from a list and see the console render it live. Scope is deliberately "demo depth" (showing off what already exists), not the teaching/diagnosis product — that stays parked.

## What Changes

- Add a single scenario picker (dropdown/select) to `/console` only — the homepage's hero demo is unaffected and keeps its one fixed scenario.
- Define a named-scenario data structure that bundles a LOCAL (CPE) config, REMOTE (sector) config, and service-layer config together — this concept doesn't exist yet; today's `Scenario`/`ServiceLayerScenario` types are each scoped to a single engine call, not a cross-panel bundle.
- Ship 10 named scenarios, each backed by fault factories that already exist — no new simulation behavior:
  - Healthy (no faults)
  - Wind misalignment, rain fade, cable degradation, foliage growth, interference — each a radio-link fault applied to the CPE/LOCAL side (`packages/simulation-engine/src/faults.ts`)
  - Expired lease, double NAT, customer router offline — service-layer faults (`packages/simulation-engine/src/service-layer.ts`)
  - Wrong boot order — a service-layer fault that also requires a low `baseUptimeSeconds` on the CPE/LOCAL radio-link config, reproducing its designed "radio green, customer down" signature
- Selecting a scenario swaps which configs feed the existing 1Hz simulation tick; `LinkPanel` and `ServiceLayerPanel` continue to render live `simulateRadioLink`/`simulateServiceLayer` output, just parameterized by the current selection instead of one fixed config.
- Cable degradation ships as-is: it only moves `chainImbalanceDb`, not the overall severity badge. This is intentional — a documented, accepted quirk from the fault library's original build, not something this change patches over.

## Capabilities

### New Capabilities
- `console-scenario-picker`: a visitor-selectable, named bundle of LOCAL+REMOTE+service-layer simulation configs, exposed as a control on `/console`.

### Modified Capabilities
- `radio-console-ui`: the panel's displayed state is now driven by a visitor-selected scenario rather than one fixed hardcoded configuration; existing requirements (public route, live simulation-backed values, auto-updating, responsive single-component layout) all still hold, but "the panel renders both sides from real simulation output" now needs to account for which scenario is currently selected.

## Impact

- `apps/web/src/lib/demo-link-telemetry.ts` — `useDemoConfigs`/`useDemoLinkTelemetry` gain selection state; homepage (`Landing.tsx`) keeps calling the hook with no selection (defaults to the existing fixed scenario) since it doesn't get the picker.
- `apps/web/src/pages/Console.tsx` — mounts the new picker control and passes the selected scenario down.
- New scenario-definition module (exact location decided in design.md) mapping each of the 10 names to LOCAL/REMOTE/service-layer configs, built from existing `packages/simulation-engine` fault factories.
- No changes to `packages/simulation-engine` itself (no new fault behavior) or to `LinkPanel`/`ServiceLayerPanel`'s component APIs.
