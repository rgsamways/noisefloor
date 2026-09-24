## Context

See proposal.md for motivation. Current mechanics that constrain this design:

- `deriveLinkGroup(health, baseline, chainImbalanceDeltaDb, rng)` in `link-health.ts` derives every radio-link field from one `health` scalar plus a separate `chainImbalanceDeltaDb`. `noiseFloorDbm` is `NOISE_FLOOR_DBM + jitter(rng, 1)` — a constant, no fault input reaches it.
- `FaultEffect = { linkHealthDelta, chainImbalanceDeltaDb }` is what every fault shape (`step`, `rampRecover`, `rampPersist`, `intermittentCycle`) produces; `combinedFaultEffect` sums an array of `FaultDefinition`s into one `FaultEffect`.
- `windMisalignmentFault` returns one `StepFault` targeting `chainImbalanceDb`. `interferenceFault` returns one `IntermittentCycleFault` targeting `linkHealth`.
- `console-scenarios.ts` builds each scenario's `local`/`remote` `SimulationConfig` independently; there is no shared state between the two `simulateRadioLink` calls.

## Goals / Non-Goals

**Goals:**
- Make `noiseFloorDbm` independently fault-movable.
- Fix Wind Misalignment's missing primary tell and Interference's backwards tell.
- Make `linkQualityPct`/`modulationIndex` react correctly regardless of which axis (signal or noise) caused the SNR loss.
- Apply Misalignment/Rain Fade/Foliage Growth symmetrically to LOCAL+REMOTE without adding engine-level shared state.

**Non-Goals:**
- Foliage Growth's wind-wobble and Misalignment's tilt-vs-rotation chain split (deferred, per proposal.md).
- Extending noise-driven degradation to `deriveThroughputGroup`/`deriveFarEndGroup` (`txRateMbps`, `errorsRetries`, `packetLossPct`, etc.). These stay driven by the raw signal-axis `health` scalar only, unchanged. The doc's interference section does mention retransmissions/packet-loss as a secondary corroborating symptom, but its primary, defining tell is noise-up-signal-flat (also the quick-reference table's framing) — the same primary/secondary tiering that justified treating Misalignment's chain-imbalance-only implementation as the bug worth fixing now while its own primary tell was missing. Wiring noise into throughput/retry fields is a reasonable future completeness pass, not part of this correctness fix.
- `linkState` (connected/associating/down) stays keyed to raw `health` only, not the new SNR-deficit scalar. No fault magnitude introduced here is intended to take a link fully down from noise alone.

## Decisions

**1. Add `noiseFloorDeltaDb` as a third field on `FaultEffect`, and a third fault `target` value (`"noiseFloorDbm"`).**
`deriveLinkGroup` gains a `noiseFloorDeltaDb` parameter (mirroring the existing `chainImbalanceDeltaDb` parameter) and computes `noiseFloorDbm = NOISE_FLOOR_DBM + noiseFloorDeltaDb + jitter(rng, 1)`. `IntermittentCycleFault`'s `target` type broadens from `"linkHealth"` only to `"linkHealth" | "noiseFloorDbm"` (it's the only shape `interferenceFault` uses), and `intermittentCycleEffectAt` branches on `target` the same way `stepEffectAt`/`rampPersistEffectAt` already do.
*Alternative considered:* a fully generic `target: keyof LinkGroupValues` with a single delta field. Rejected — it would let a fault claim to target fields (`linkQualityPct`, `frequencyMhz`, etc.) that have no defined delta semantics, trading a small amount of duplication for a type system that can't express nonsense faults.

**2. `interferenceFault`'s `magnitude` option changes units from a 0–1 health-deficit fraction to a direct dB noise-floor rise.**
The old `magnitude` was a fraction of `linkHealth` (default 0.35); that unit is meaningless on the noise-floor axis, which is a dB quantity. New default: 15 dB (clean baseline ~-92 dBm; the doc's "-80 or higher means something is filling the channel" implies a notable rise is in the 12–15+ dB range). `console-scenarios.ts`'s interference scenario doesn't pass `magnitude` today, so this call site is unaffected; anything that did would need updating (nothing else in the repo currently does).

**3. `windMisalignmentFault` returns two co-triggered `StepFault`s instead of one.**
Real misalignment has two simultaneous tells at the same trigger instant: the signal/SNR step (primary) and the chain-imbalance step (secondary). Rather than inventing a fault shape that can target two fields in one definition, `windMisalignmentFault` returns `StepFault[]` (one targeting `linkHealth`, one targeting `chainImbalanceDb`), reusing `combinedFaultEffect`'s existing multi-fault summing. Call sites change from `faults: [windMisalignmentFault(t)]` to `faults: [...windMisalignmentFault(t)]`.
*Alternative considered:* add a `StepFault` variant with `target: Array<"linkHealth" | "chainImbalanceDb">` and a `deltas` map. Rejected as unnecessary generality for a pattern (`Fault[]` from one factory) the engine already supports.

**4. `linkQualityPct`/`modulationIndex` derive from a computed SNR-deficit scalar, not the raw `health` input.**
Compute `snrDeficitDb = (baseline.linkHealth - health) * SIGNAL_DB_PER_HEALTH_UNIT + noiseFloorDeltaDb`, then `snrHealth = clamp(baseline.linkHealth - snrDeficitDb / SIGNAL_DB_PER_HEALTH_UNIT, 0, 1)`, and use `snrHealth` where `linkQualityPct`/`modulationIndex` currently use `health`. When `noiseFloorDeltaDb` is 0 (every existing fault except the new Interference target), `snrHealth === health` exactly — no behavior change for Misalignment/Rain Fade/Foliage Growth. Under Interference, `health` stays at baseline (signal untouched) while `snrHealth` drops, correctly degrading quality/modulation from noise alone.
*Alternative considered:* compute quality/modulation directly from the already-derived `snrDb` vs. a stored baseline SNR value, rather than re-deriving a health-shaped scalar. Rejected only for consistency of units — `SIGNAL_DB_PER_HEALTH_UNIT` already defines the health↔dB conversion the rest of the module uses, so reusing it here keeps one conversion constant instead of two.

**5. Symmetric LOCAL+REMOTE application is scenario-authoring, not an engine feature.**
`console-scenarios.ts` passes the same `FaultDefinition`(s) to both `local.scenario.faults` and `remote.scenario.faults` for Wind Misalignment, Rain Fade, and Foliage Growth. Each side's `simulateRadioLink` call remains fully independent — this needs no shared state, no new engine API, just building both `SimulationConfig`s with the same fault array. Each side computes its own dB delta against its own baseline, which is a reasonable reading of "both directions degrade roughly equally" (per real fixed-wireless links, LOCAL and REMOTE baselines are usually close anyway).

## Risks / Trade-offs

- **[Risk]** Treating throughput/retry fields as out of scope (Non-Goals) means Interference will show degraded quality/modulation but unchanged `txRateMbps`/`errorsRetries` — an internally inconsistent-looking snapshot if someone compares those fields side by side. → **Mitigation**: acceptable for this pass per the primary/secondary tiering above; flag as the natural next completeness item if it reads as odd in review.
- **[Risk]** `interferenceFault`'s `magnitude` unit change is a breaking change to that function's public contract, even though no current call site is affected. → **Mitigation**: only one call site exists in the repo today (checked); no migration needed now, but worth a one-line note in the function's own comment (as the existing code already does for its other design decisions) so a future caller doesn't reuse the old 0–1 convention.
- **[Risk]** Choosing 15 dB as interference's default noise-floor rise is a guess, not a field-confirmed number (unlike Misalignment's field-confirmed ~5 dB chain-imbalance threshold). → **Mitigation**: flagged here explicitly per Robin's standing preference for surfacing guess-vs-confirmed defaults; revisit if a real interference ticket's numbers come back different.

## Migration Plan

No data migration — this is simulation logic only, no persisted state. Land as one PR touching `packages/simulation-engine` (`faults.ts`, `link-health.ts`) and `apps/web/src/lib/console-scenarios.ts`, both packages rebuilt (`pnpm --filter <pkg> build`, not just typechecked — see memory `feedback_typecheck_not_build`) before verifying in the browser, then deployed via the usual manual `vercel --prod`.
