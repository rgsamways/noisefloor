## Context

See proposal.md for the reasoning behind dissolving the original cross-telemetry blocker. This is the smallest change in the service-layer fault line: one new preset in `packages/simulation-engine/src/service-layer.ts`, no schema change, no change to `simulateRadioLink`.

## Goals / Non-Goals

**Goals:**
- A `wrongBootOrderFault` preset that's semantically distinct from `expiredLeaseFault` for scenario-authoring clarity, even though its current effect is identical.
- Clear documentation of the scenario-pairing convention needed to represent the *full* fault (both panels), without adding any code to enforce or automate that pairing.

**Non-Goals:**
- No shared power-cut event type, no coordination code between `simulateRadioLink` and `simulateServiceLayer` — confirmed unnecessary per proposal.md's reasoning.
- No repair/remediation modeling (still a standing Non-Goal from the original `simulation-engine` change) — nothing in this fault "gets fixed" by a simulated correct power-cycle order; it just starts broken and stays that way, same as every other persistent fault in this engine.
- No new field anywhere representing *why* the lease broke. The trainee is meant to infer boot-order specifically from the radio's recent-reboot evidence correlating with the broken lease — adding a cause field would hand them the answer instead.

## Decisions

**`wrongBootOrderFault(triggerAtSec)` calls the same override shape as `expiredLeaseFault`, as its own named function, not a re-exported alias.** Two nearly-identical one-line functions is the honest state of the design today: the *mechanism* is identical, but the *name* is what a scenario author reaches for, and what future work hangs off of. If this engine ever grows a repair-action model, `wrongBootOrderFault` is the one that should become clearable by "power-cycle radio first, then router" while `expiredLeaseFault` might stay clearable by any restart order — that divergence has nowhere to attach if they're the same function today.

**The radio-link half of this fault is a documented convention, not code.** A scenario wanting the full "radio green, customer down" picture sets `simulateRadioLink`'s existing `baseUptimeSeconds` config to a small value (e.g., a few minutes) at the same simulated time as `wrongBootOrderFault`'s `triggerAtSec` — both functions already accept independent timing configuration, so no new plumbing is needed to make their outputs land at correlated moments. This is recorded here and as a code comment on `wrongBootOrderFault`, not enforced by any type or runtime check, since enforcing it would mean the two simulate functions taking on a dependency neither needs otherwise.

## Risks / Trade-offs

- **[Risk] Two functions with identical bodies (`expiredLeaseFault`, `wrongBootOrderFault`) could drift apart accidentally if one is edited without the other, when the intent is that they diverge deliberately, not accidentally.** → **Mitigation**: a short code comment on both functions cross-referencing each other and this change, so an editor notices the relationship before changing one in isolation. Acceptable at this scale (two tiny functions); would be worth a shared helper if a third identical-effect fault ever shows up.
- **[Risk] The scenario-pairing convention is documentation-only — nothing stops a scenario author from using `wrongBootOrderFault` without pairing it with a reset `baseUptimeSeconds`, silently losing the fault's actual diagnostic point.** → **Mitigation**: acceptable for now since no scenario-authoring layer exists yet (no console UI, no case/content system for the console); revisit if/when a real scenario library is built and this convention is worth enforcing structurally.
