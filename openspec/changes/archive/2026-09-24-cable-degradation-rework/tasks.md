## 1. Schema

- [x] 1.1 Add `linkSpeedMbps`, `duplex` (`"full" | "half"`), and `crcErrorCount` to `LanPortGroupSchema` in `packages/console-schema/src/service-layer.ts`. Verify with `pnpm --filter @noisefloor/console-schema build`.
- [x] 1.2 Add/extend tests in `packages/console-schema/src/service-layer.test.ts` covering a degraded-but-up LAN port (per the new schema requirement's two scenarios). Verify with `pnpm -w test`.

## 2. Simulation engine

- [x] 2.1 Remove `cableDegradationFault` from `packages/simulation-engine/src/faults.ts` (keep `RampPersistFault`/`rampPersist` itself — Foliage Growth still uses it). Remove or update any now-stale doc comments referencing it.
- [x] 2.2 Extend `ServiceLayerOverrides` and `simulateServiceLayer`'s defaults in `packages/simulation-engine/src/service-layer.ts` for the three new fields (healthy defaults: `linkSpeedMbps: 1000`, `duplex: "full"`, `crcErrorCount: 0`), wired into the returned `lanPort` group.
- [x] 2.3 Add a new `cableDegradationFault(triggerAtSec)` in `packages/simulation-engine/src/service-layer.ts`, overriding `linkSpeedMbps` down (e.g. `100`) and `crcErrorCount` to a nonzero value, leaving `lanPortLinkUp` at its default (`true`) and every other override untouched.
- [x] 2.4 Update `packages/simulation-engine/src/service-layer.test.ts` with tests for the new fault (per the `simulation-engine` delta spec's two scenarios: degraded-but-connected LAN port, and no `RadioLinkTelemetry` dependency/effect). Remove or update any existing test that referenced the old RF-based `cableDegradationFault`. Verify with `pnpm -w test`.

## 3. Console UI

- [x] 3.1 Update `apps/web/src/lib/console-scenarios.ts`: move the Cable Degradation scenario's fault from `local.scenario.faults` (radio-link) to `serviceLayer.scenario.faults`, using the new fault. Verify with `pnpm --filter web exec tsc --noEmit`.
- [x] 3.2 Add rows for link speed, duplex, and CRC error count to `ServiceLayerPanel.tsx`'s "Addressing & port" section.
- [x] 3.3 Export `serviceLayerSeverity` from `ServiceLayerPanel.tsx` (or a shared module) and add a "degraded" (`warn`) condition for a LAN port that's up but below its healthy speed or showing a nonzero CRC error count, distinct from the existing "down" (`bad`) condition. Add a unit test covering: healthy (good), degraded-but-up (warn), fully down (bad), double-NAT (warn) — confirming the new condition doesn't regress the existing ones. Verify with `pnpm -w test`.

## 4. Full verification

- [x] 4.1 Run `pnpm -w test`, `pnpm --filter web exec tsc --noEmit`, and `pnpm lint`; confirm all pass with no regressions.
- [x] 4.2 Load `/console` in a real browser, select Cable Degradation, and confirm: both radio-link columns (LOCAL and REMOTE) show full health with no orange/red anywhere, and the service-layer panel shows DEGRADED with the new link-speed/CRC-error rows reflecting the fault.
- [x] 4.3 Cycle through the other 9 scenarios in a real browser and confirm none regressed — in particular Wind Misalignment (no longer shares any code with Cable Degradation) and the other three service-layer faults (Expired Lease, Double NAT, Customer Router Offline).
