## Why

`packages/simulation-engine` (implemented, archived 2026-09-21) proved its fault mechanism with two faults, wind misalignment and rain fade, and explicitly deferred the other three radio-link time-signatures from `docs/NOISEFLOOR-CONSOLE-HANDOFF.md` §6.2 — interference, failing cable/water ingress, and foliage growth — as follow-up work that should "reuse the same time-signature mechanism," not invent a parallel one. This change is that follow-up.

Its own design.md anticipated exactly this moment: "A future fault... is expected to be a new named parameterization of one of these two shapes, or — if genuinely neither fits (e.g. interference's daily-rhythm intermittency) — a third shape added to the same mechanism, not a special case bolted onto the engine's core loop." That prediction turns out to be half right: two of the three remaining faults don't fit the existing shapes either.

## What Changes

**Two of the three faults need a shape that doesn't exist yet, and the third needs a genuinely new one — this is a scope decision worth your pushback during review, not a settled fact:**

- **Failing cable / water ingress** — "slow degradation over weeks" (handoff §6.2). Ramps in like rain fade, but does **not** self-recover; it stays bad until someone physically fixes the cable, which this engine doesn't model. `rampRecover` always ends in recovery, so it doesn't fit.
- **Foliage growth** — "seasonal, gradual" (handoff §6.2). Same shape gap as cable degradation: a gradual ramp that plateaus rather than recovering within any simulation run.
- **Interference** — "intermittent, often a daily rhythm" (handoff §6.2). Periodic/cyclical, not a single ramp or step at all — neither existing shape captures repeating on/off activation.

Proposed: one new shape, `rampPersist` (ramps in, then holds indefinitely — no automatic recovery), covers both cable degradation and foliage growth as two different named presets of the *same* mechanism, differing only in typical timescale and which field they target. A second new shape, `intermittentCycle` (repeats a cycle period, active for a configured portion of each cycle), covers interference. Three new named presets: `cableDegradationFault`, `foliageGrowthFault`, `interferenceFault`.

**Open domain question, not assumed either way:** `packages/console-schema`'s own `chainImbalanceDb` doc-comment says chain imbalance "catches a bad cable or wet connector immediately" — the same field wind misalignment already targets via an instant `step`. Should `cableDegradationFault` target `chainImbalanceDb` too (gradually, via `rampPersist`, instead of instantly), or does a failing/wet cable actually show up as a general signal/SNR decline instead, with both chains degrading together (leaving chain imbalance unmoved)? This is exactly the kind of real-field-experience question that corrected wind misalignment and rain fade during `simulation-engine`'s own review — flagged here for the same treatment, not guessed at.

**Not in scope:**
- No service-layer faults (handoff §5) — still deferred, unrelated shape of work.
- No log simulation (handoff §7).
- No console UI, no repair/remediation actions, no vendor drivers.
- No change to `wind misalignment` or `rain fade`'s existing behavior.

## Capabilities

### New Capabilities
(none as a new top-level capability — this extends the existing `simulation-engine` capability's requirements)

### Modified Capabilities
- `simulation-engine`: adds the `rampPersist` and `intermittentCycle` fault shapes and three new named presets (`cableDegradationFault`, `foliageGrowthFault`, `interferenceFault`) to the engine's extensible fault mechanism.

## Impact

- **Affected code**: `packages/simulation-engine` only — new shape handlers and presets alongside the existing `step`/`rampRecover` mechanism in `faults.ts`. No change to `packages/console-schema`.
- **Not affected**: the two already-shipped faults' behavior, `ServiceLayerTelemetry`, any console UI (doesn't exist yet).
- **Unlocks**: the full radio-link fault catalog from handoff §6.2 exists in the engine; service-layer faults (§5) and log simulation (§7) remain the next deferred pieces after this.
