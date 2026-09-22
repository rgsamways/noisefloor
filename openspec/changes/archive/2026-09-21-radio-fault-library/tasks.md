## 1. rampPersist shape

- [x] 1.1 Add the `RampPersistFault` type (`shape: "rampPersist"`, `startAtSec`, `rampSec`, `target`, `delta`) to `faults.ts`'s `FaultDefinition` union
- [x] 1.2 Implement `rampPersistEffectAt`: linear ramp-in over `rampSec`, full effect held indefinitely after, and verify a unit test shows the effect reaches full magnitude at `startAtSec + rampSec` and stays there for snapshots taken much later
- [x] 1.3 Wire `rampPersist` into `faultEffectAt`'s shape dispatch

## 2. cableDegradationFault and foliageGrowthFault presets

- [x] 2.1 Implement `cableDegradationFault(startAtSec, opts)` as a `rampPersist` preset with a caller-configurable `rampSec` (default in the multi-day-to-multi-week range) targeting the field decided in review (`chainImbalanceDb` or `linkHealth` — see design.md's open decision) and verify a unit test exercises it end-to-end (healthy → ramping → plateaued)
- [x] 2.2 Implement `foliageGrowthFault(startAtSec, opts)` as a `rampPersist` preset with a caller-configurable `rampSec` (default at a longer, seasonal-scale duration) targeting `linkHealth` and verify a unit test exercises it end-to-end (healthy → ramping → plateaued)

## 3. intermittentCycle shape

- [x] 3.1 Add the `IntermittentCycleFault` type (`shape: "intermittentCycle"`, `startAtSec`, `cyclePeriodSec`, `activeDurationSec`, `target`, `delta`) to the `FaultDefinition` union
- [x] 3.2 Implement `intermittentCycleEffectAt`: phase = `(t - startAtSec) mod cyclePeriodSec`; full effect when `phase < activeDurationSec`, no effect otherwise, and verify a unit test shows both an in-window and an out-of-window snapshot within the same cycle, plus an equivalent pair of snapshots in a later cycle showing the same pattern
- [x] 3.3 Wire `intermittentCycle` into `faultEffectAt`'s shape dispatch

## 4. interferenceFault preset

- [x] 4.1 Implement `interferenceFault(startAtSec, opts)` as an `intermittentCycle` preset defaulting `cyclePeriodSec` to roughly a day, with caller-configurable `activeDurationSec`, targeting `linkHealth`, and verify a unit test exercises it end-to-end (an active-window snapshot is degraded, an inactive-window snapshot matches healthy baseline)

## 5. Verification

- [x] 5.1 Run the full `packages/simulation-engine` unit test suite (including the new shape/preset tests) and confirm it passes
- [x] 5.2 `pnpm --filter @noisefloor/simulation-engine typecheck`/`build`
- [x] 5.3 `pnpm lint && pnpm typecheck && pnpm test` at the repo root (confirms `console-schema`, the two existing faults, and the parked case-study packages are unaffected)
