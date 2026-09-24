## Why

Robin compiled real T1 diagnostic answers for the radio-link faults (docs/t1-wireless-troubleshooting-scenarios.md) and two of today's four radio-link faults are wrong against that source, not just incomplete. Wind Misalignment's primary real-world tell is a signal/SNR step-down with noise floor unchanged — today's `windMisalignmentFault` only steps `chainImbalanceDb` and never touches signal or SNR, so a trainee never sees the tell that actually gets a real fault called in. Interference's tell is the opposite: signal unchanged, noise floor rises — but today's `interferenceFault` degrades the same `linkHealth` scalar as Rain Fade and Foliage Growth, so it currently produces Misalignment's signature instead of its own, backwards from the diagnostic rule Robin's own document states. Both are teaching the wrong lesson today, not just a less-complete one.

## What Changes

- Add a second, independently fault-movable axis to the radio-link engine: `noiseFloorDbm` (currently a hardcoded constant no fault can affect) gets a fault-driven delta, alongside the existing `linkHealth` (signal) and `chainImbalanceDb` axes.
- Retarget `interferenceFault` from `linkHealth` to the new noise-floor axis, so Interference raises noise floor while signal stays at its healthy-baseline value.
- Add a `linkHealth` step to `windMisalignmentFault` alongside its existing `chainImbalanceDb` step, so Misalignment produces its primary signal/SNR step-down as well as its secondary chain-imbalance tell.
- Change how `linkQualityPct` and `modulationIndex` are derived: instead of reading the raw `health` input directly, they SHALL derive from the computed SNR deficit (healthy-baseline SNR vs. current SNR, where SNR = signal − noise floor). This makes quality/modulation degrade correctly under Interference (noise-driven SNR loss with signal unchanged) without a fault-specific special case, and leaves Misalignment/Rain Fade/Foliage Growth's existing signal-driven behavior unchanged (their SNR deficit today is entirely signal-driven, since noise floor doesn't move for them).
- Apply Wind Misalignment, Rain Fade, and Foliage Growth to both the LOCAL (CPE) and REMOTE (sector) radio-link configurations in the scenario picker, matching their real-world symmetric degradation — done as a scenario-authoring change (the same `FaultDefinition` object given to both configs), not a new engine mechanism. Interference stays LOCAL-only, matching its real-world one-sided-per-receiver behavior.

Explicitly out of scope for this change (deferred to an immediate follow-up):
- Foliage Growth's wind-driven signal wobble (distinguishes it from Misalignment's clean step; a completeness gap, not a wrong-signature bug).
- Modeling "both chains drop together" (tilt/swing) vs. "chains split apart" (rotation) for Wind Misalignment — `packages/dashboards`' `splitChains` always splits symmetrically around signal today and would need its own change.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `simulation-engine`: `noiseFloorDbm` becomes fault-movable via a new axis; `interferenceFault` retargets to that axis; `windMisalignmentFault` gains an added `linkHealth` step; `linkQualityPct`/`modulationIndex` derive from computed SNR deficit rather than the raw `health` input.
- `console-scenario-picker`: Wind Misalignment, Rain Fade, and Foliage Growth now apply their fault to both LOCAL and REMOTE; Interference remains LOCAL-only.

## Impact

- `packages/simulation-engine/src/faults.ts`: new fault-effect field/target for noise floor; `windMisalignmentFault` and `interferenceFault` definitions change.
- `packages/simulation-engine/src/link-health.ts`: `deriveLinkGroup` takes a noise-floor delta input; `linkQualityPct`/`modulationIndex` computation reworked to derive from SNR deficit.
- `apps/web/src/lib/console-scenarios.ts`: Wind Misalignment, Rain Fade, and Foliage Growth scenario definitions apply their fault to both `local` and `remote` configs instead of `local` only.
- No schema changes (`radio-console-schema` untouched — `noiseFloorDbm` already exists in `RadioLinkTelemetry`, it just becomes a live-moving field for some faults instead of a constant).
