## 1. Package setup

- [x] 1.1 Scaffold `packages/simulation-engine` (package.json depending on `@noisefloor/console-schema` workspace package, tsconfig, mirroring `packages/console-schema`'s build/lint/test setup) and verify it builds as an empty package
- [x] 1.2 Add a small seeded PRNG module (mulberry32, seeded by string or number) and verify a unit test confirms the same seed produces the same sequence

## 2. Core linkHealth model

- [x] 2.1 Implement the `linkHealth` scalar (0–1) → `link` group field mapping (signal, SNR, modulation index, chain imbalance) and verify a unit test shows a lower `linkHealth` produces lower `signalDbm`/`snrDb`
- [x] 2.2 Extend the mapping to `throughput` group fields (TX/RX rate, retries via `farEnd.errorsRetries`) and verify a unit test shows degraded `linkHealth` produces no-higher rate and no-lower retries than the healthy baseline
- [x] 2.3 Add seeded jitter on top of the deterministic mapping and verify repeated calls with the same seed and time produce identical output (determinism), while different seeds produce different jitter

## 3. LinkProfile-relative baseline

- [x] 3.1 Implement a `LinkProfile` → baseline `linkHealth`/`signalDbm` mapping (distance/band/gear-class-aware, explicitly approximate) and verify a unit test shows two different profiles produce different healthy baselines, each internally consistent
- [x] 3.2 Implement the healthy-baseline snapshot function (`LinkProfile`, seed, time) → `RadioLinkTelemetry` with no active fault, and verify it produces a fully valid `RadioLinkTelemetry` per the `console-schema` Zod schema

## 4. Time-signature fault mechanism

- [x] 4.1 Define the fault shape types (`step`, `rampRecover`) and their parameters (affected-field-group scope, magnitude, `startAt`, and `rampRecover`'s ramp/hold/recover durations)
- [x] 4.2 Implement `step`: apply an instantaneous, persistent `linkHealth` delta at `startAt`, and verify a unit test shows the affected fields shift within one snapshot of `startAt` and remain shifted for snapshots taken well after it
- [x] 4.3 Implement `rampRecover`: apply a `linkHealth` delta that phases in and back out over configured durations, and verify a unit test shows snapshots at the low point are degraded and snapshots after the full duration match the healthy-baseline trajectory

## 5. The two representative faults

- [x] 5.1 Define "wind misalignment" as a `step` parameterization targeting `chainImbalanceDb` specifically (stepping to roughly 5 dB or greater — the field-confirmed threshold at which misalignment is obvious) and verify a unit test exercises it end-to-end (healthy → triggered → `chainImbalanceDb` still at/above ~5 dB much later)
- [x] 5.2 Define "rain fade" as a `rampRecover` parameterization with caller-configurable ramp/hold/recover durations (not a fixed "minutes" timescale — real durations range from minutes to multiple hours) and verify a unit test exercises it end-to-end at both a short (minutes) and long (hours) configured duration (healthy → ramping → low point → recovered)

## 6. Staleness / dead-poll

- [x] 6.1 Implement a far-end-drop scenario modifier that freezes the affected side's `linkHealth` evolution and repeats its last computed `Reading` (`value` and `asOf` unchanged) for snapshots requested after the drop, and verify a unit test confirms both `value` and `asOf` stop advancing after the drop point while snapshots before it update normally

## 7. Verification

- [x] 7.1 Run the full `packages/simulation-engine` unit test suite and confirm it passes
- [x] 7.2 `pnpm --filter @noisefloor/simulation-engine typecheck`/`build`
- [x] 7.3 `pnpm lint && pnpm typecheck && pnpm test` at the repo root (confirms `console-schema` and the parked case-study packages are unaffected)
