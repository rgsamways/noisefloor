## Context

See proposal.md for motivation. This extends `packages/simulation-engine`'s existing `FaultDefinition` union (currently `StepFault | RampRecoverFault` in `faults.ts`) with two new shapes and three new named presets. Everything downstream of `combinedFaultEffect` (the `linkHealth`/`chainImbalanceDb` mapping in `link-health.ts`, the `simulateRadioLink` orchestration) is unchanged — new shapes plug into the same `FaultEffect` accumulation the existing two already use.

## Goals / Non-Goals

**Goals:**
- Cover the remaining three handoff §6.2 radio-link time-signatures using no more than two new shapes, both general enough to be reused again later (the mechanism, not one-off fault logic — same bar `simulation-engine` set for itself).
- Keep `cableDegradationFault` and `foliageGrowthFault` as two presets of one shape (`rampPersist`), since they're mechanistically identical — a slow, non-recovering ramp — differing only in typical duration and target field.

**Non-Goals:**
- No repair/remediation modeling (an un-trigger exists as a mechanism a caller can use, e.g. by bounding the scenario, but no "tech fixed the cable at time X" concept is added).
- No service-layer faults, no log simulation — both still deferred per `simulation-engine`'s own proposal, untouched here.
- No change to `wind misalignment` or `rain fade`'s existing shapes or presets.
- No console UI consumption of these faults — nothing renders yet.

## Decisions

**New shape: `rampPersist`.** `{ shape: "rampPersist"; startAtSec: number; rampSec: number; target: "linkHealth" | "chainImbalanceDb"; delta: number }`. Reuses `rampRecover`'s ramp-in math (linear interpolation from 0 to full effect over `rampSec`) but stops there — `frac` reaches 1 at `rampEnd` and stays there for all `atSec >= startAtSec + rampSec`, with no hold/recover phase to compute. This is a strict subset of `rampRecover`'s state machine, not new math.

**`cableDegradationFault` and `foliageGrowthFault` are both `rampPersist` presets, differing only in defaults.** `cableDegradationFault(startAtSec, opts)` defaults to a multi-day-to-multi-week `rampSec` (caller-configurable, same "don't hardcode a timescale" lesson from rain fade's review correction). `foliageGrowthFault(startAtSec, opts)` defaults to a longer, seasonal-scale `rampSec`. **Open decision, not resolved here:** which field each targets. Provisionally, `foliageGrowthFault` targets `linkHealth` (foliage attenuates the whole path, not one chain differentially) and `cableDegradationFault` targets `chainImbalanceDb` (per `console-schema`'s own doc-comment linking that field to "a bad cable or wet connector") — but this is exactly the domain question proposal.md flags for Robin's review, not a settled fact. If review says a failing cable actually degrades both chains together, `cableDegradationFault` should target `linkHealth` instead, using the identical `rampPersist` shape — either answer is a one-line change to the preset, not a mechanism change.

**New shape: `intermittentCycle`.** `{ shape: "intermittentCycle"; startAtSec: number; cyclePeriodSec: number; activeDurationSec: number; target: "linkHealth"; delta: number }`. Effect at time `t` (for `t >= startAtSec`): compute `phase = (t - startAtSec) mod cyclePeriodSec`; if `phase < activeDurationSec`, the fault is fully active (delta applied); otherwise inactive (no effect). This is a hard on/off gate rather than a ramped one — interference in the handoff doc's framing is bursty, not gradual, so a step-like on/off within each cycle matches its character better than another ramp.

**`interferenceFault` is an `intermittentCycle` preset defaulting `cyclePeriodSec` to roughly a day (86400s) and `activeDurationSec` to a caller-configurable fraction of it** (e.g. a few hours), matching handoff §6.2's "often a daily rhythm" — "often," not "always," so both parameters stay fully open rather than hardcoded, same posture as rain fade's duration.

**No per-cycle randomization in this change**, despite proposal.md floating it as an option ("per-cycle jitter so it doesn't feel like a metronome"). Decided against for this pass: `intermittentCycle`'s spec requirement only asks for correct on/off gating and repetition across cycles, and adding jitter to cycle boundaries would need its own defined behavior (does jitter shift the boundary per-cycle? by how much?) that nothing in the handoff doc specifies. Cutting it keeps this change to exactly what's specified; a jittered variant is a small, separable follow-up if a too-metronomic feel turns out to matter once this is actually seen in a UI.

## Risks / Trade-offs

- **[Risk] The chainImbalanceDb-vs-linkHealth target for `cableDegradationFault` remains a guess after review — asked directly, and the honest answer was "not sure," not a confirmation either way.** Same category as the healthy-baseline-by-distance guess in `radio-console-schema`'s and `simulation-engine`'s own risk sections, but unlike those, this one didn't get resolved by real-world experience on review — it's still exactly as uncertain as before asking. → **Mitigation**: the guess (chain imbalance) stands as documented above precisely because it's not disprovable right now; revisit once there's an actual failing cable/wet connector to check against (a real device in phase two, or field notes), not by guessing harder now. Whichever way it turns out is a one-line preset change, not a redesign.
- **[Risk] `rampPersist` and `rampRecover` are near-duplicate state machines (ramp-in math is identical); maintaining both risks drift if one is changed without the other.** → **Mitigation**: acceptable for now given the small size of both; if a third "ramp-in" variant is ever needed, that's the trigger to factor the shared ramp-in math into one helper both shapes call, not before.
- **[Risk] No jitter in `intermittentCycle` may look too regular once actually rendered in a UI that doesn't exist yet.** → **Mitigation**: explicitly deferred above as a separable follow-up, not a blocker for this change.
