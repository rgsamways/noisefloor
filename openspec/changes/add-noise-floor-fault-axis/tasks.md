## 1. Engine: noise-floor axis

- [x] 1.1 Add `noiseFloorDeltaDb` to `FaultEffect` in `faults.ts`, update `NO_EFFECT` and `combinedFaultEffect` to sum it, and verify existing fault tests (which don't set it) still pass with it defaulting to `0`
- [x] 1.2 Broaden `IntermittentCycleFault.target` to `"linkHealth" | "noiseFloorDbm"` and branch `intermittentCycleEffectAt` on it, verified by a unit test asserting a `noiseFloorDbm`-targeted intermittent fault produces `noiseFloorDeltaDb` (not `linkHealthDelta`) during its active window
- [x] 1.3 Add `noiseFloorDeltaDb` parameter to `deriveLinkGroup` in `link-health.ts` and compute `noiseFloorDbm = NOISE_FLOOR_DBM + noiseFloorDeltaDb + jitter(rng, 1)`, verified by a unit test asserting a nonzero `noiseFloorDeltaDb` moves `noiseFloorDbm` while leaving `signalDbm` unchanged

## 2. Engine: derived quality/modulation from SNR deficit

- [x] 2.1 Compute `snrDeficitDb`/`snrHealth` in `deriveLinkGroup` per design.md's Decision 4, and switch `linkQualityPct`/`modulationIndex` to derive from `snrHealth` instead of `health`, verified by a unit test confirming behavior is unchanged (bit-for-bit, modulo jitter) when `noiseFloorDeltaDb` is `0`
- [x] 2.2 Add a unit test asserting a noise-floor-only fault (`noiseFloorDeltaDb > 0`, `health` at baseline) degrades `linkQualityPct` and `modulationIndex` while `signalDbm` stays at its healthy-baseline value

## 3. Engine: fix Wind Misalignment and Interference fault definitions

- [x] 3.1 Change `windMisalignmentFault` to return `StepFault[]` (existing `chainImbalanceDb` step plus a new `linkHealth` step at the same trigger point), verified by a unit test asserting both `chainImbalanceDb` and `signalDbm`/`snrDb` degrade together from one trigger while `noiseFloorDbm` stays at baseline
- [x] 3.2 Change `interferenceFault` to target `noiseFloorDbm` with a direct-dB `magnitude` (default per design.md Decision 2), verified by a unit test asserting `noiseFloorDbm` rises and `signalDbm` stays at its healthy-baseline value during an active window
- [x] 3.3 Update `faults.ts`'s own inline comments on both functions to describe the corrected signature (matching the file's existing comment style), and confirm no other test in the `simulation-engine` package asserts the old (now-changed) behavior

## 4. apps/web: wire the fixes into the scenario picker

- [x] 4.1 Update `console-scenarios.ts`'s `windMisalignment` scenario to spread `windMisalignmentFault(...)` into the faults array (now returns an array)
- [x] 4.2 Update `console-scenarios.ts` so Wind Misalignment, Rain Fade, and Foliage Growth apply their fault(s) to both `local.scenario.faults` and `remote.scenario.faults`; leave Interference's `local`-only wiring unchanged
- [x] 4.3 Rebuild `packages/simulation-engine` (`pnpm --filter @noisefloor/simulation-engine build`) and `apps/web`'s dependency graph, then load `/console` and manually verify: Wind Misalignment shows LOCAL+REMOTE signal/SNR drop and chain imbalance; Rain Fade and Foliage Growth show LOCAL+REMOTE degradation; Interference shows LOCAL-only noise floor rise with signal unchanged and degraded quality/modulation — per memory `feedback_typecheck_not_build`, typecheck alone does not verify this

## 5. Spec conformance

- [x] 5.1 Run `openspec validate --change add-noise-floor-fault-axis --strict` and resolve any reported issues
- [x] 5.2 Confirm every scenario in the delta specs (`specs/simulation-engine/spec.md`, `specs/console-scenario-picker/spec.md`) has a corresponding passing test or manually-verified behavior from tasks 1–4
