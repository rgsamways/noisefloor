## Context

See `proposal.md` for why this change exists (`PROJECT-PLAN.md` D14) and what it covers. No validator, UI, or consumer of tension output exists yet — this change is `packages/shared` library code only.

## Goals / Non-Goals

**Goals:**
- A pure, synchronous `validateWorld(world: World): Tension[]` covering the five rule families D14 named.
- Rules unit-tested against both consistent and deliberately-broken `World` fixtures, including case 001's own described values (`NOISEFLOOR-OUTLINE.md` §9) as the "should produce zero hard tensions" baseline.
- Schema additions (`Case.author`, `Case.visibility`, `findTheFault`) landed alongside, since they're cheap and related.

**Non-Goals:**
- No device-state or season/geography rule families (`NOISEFLOOR-AUTHORING-PLAN.md` §3.2 has more; D14 set a floor of five, not all of them).
- No UI, no case-builder, no "apply this resolution" wiring — `resolution` entries are descriptive data, not executable patches. That wiring is Phase 6 work.
- No integration into case-authoring workflow yet (e.g. a `pnpm` script that runs it against `packages/cases` content) — this change delivers the function; wiring it into a workflow is a follow-up once `packages/cases` has content to check.

## Decisions

**Rules live at `packages/shared/src/validator/rules/*.ts`, one file per family, aggregated by `validateWorld` in `packages/shared/src/validator/index.ts`.** Each rule is `(world: World) => Tension[]`, pure and independently unit-testable, matching `NOISEFLOOR-AUTHORING-PLAN.md` §3.2's "each rule is a pure function... unit-tested."

**Physics thresholds and tables are named constants in `packages/shared/src/validator/constants.ts`, not inline magic numbers.** This is the single place to correct a value later, and where a provenance comment belongs per rule. **Open flag, not resolved by this design**: the actual numeric thresholds (dB tolerance bands, PHY-rate-vs-CINR tables, TDD overhead assumptions) are approximated from general RF/802.11-derived knowledge, not verified against airMAX-AC's actual published specs. `NOISEFLOOR-AUTHORING-PLAN.md` §9a.2 calls this out as the single biggest risk to the whole feature ("wrong constants teach wrong things with authority"). This change ships with best-effort constants and an explicit code comment on each marking it as pending Robin's domain review — it does not claim vendor-verified accuracy.

**`Tension.resolutions` is descriptive data, not code.** Alternative considered: make a `resolution` an `(world) => World` patch function, directly "applyable with one click" per `NOISEFLOOR-AUTHORING-PLAN.md` §3.3. Rejected for this change: there's no builder UI to click anything yet (Phase 6), and a patch-function shape would need to survive JSON serialization if tensions ever cross an API boundary, which a plain `{ field, suggestedValue, description }` shape does for free. Revisit when Phase 6 actually needs one-click apply.

**Event-coherence checking is intentionally loose about *how* an event manifests.** The rule checks that *some* series shows *some* change at or after an event's timestamp, not that the change matches a precise expected magnitude — over-specifying this would make the rule too rigid for legitimate variety in how authors express an event's effect. Precise per-event-type coherence (e.g. "a shaper-change event's magnitude must match the shaper rule's own check") is left to the shaper-specific rule, which already checks that relationship directly.

## Risks / Trade-offs

- **[Risk] Approximate physics constants could produce confidently wrong tensions** → **Mitigation**: named, commented, isolated in one constants file; flagged in this design and in code comments as pending domain review rather than presented as verified; soft severity used wherever the underlying threshold is a judgment call rather than a hard physical limit.
- **[Risk] Hard tensions are too strict and block legitimate creative case content** → **Mitigation**: only genuinely physics-impossible combinations (e.g. a modulation rate the CINR cannot support, capacity outside the achievable band, an unreflected event) are hard; everything else defaults to soft, which the authoring plan's own model treats as acknowledgeable rather than blocking.

## Migration Plan

None — new library code, no existing callers to migrate. `packages/cases` has no content yet, so there's nothing to run the validator against retroactively.
