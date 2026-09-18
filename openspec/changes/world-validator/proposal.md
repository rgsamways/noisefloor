## Why

Nothing today checks whether a case's `World` actually makes physical sense — a case author (including hand-authoring case 001) can write a signal/noise/modulation-rate combination that's impossible together, or a shaper-change event that never shows up in the throughput series it's supposed to affect, and nothing catches it. `PROJECT-PLAN.md` decision D14 queued this validator as the first thing to build after Phase 0 archives, specifically so it protects curated v1 case content before it ever needs to protect user-authored content from a future builder UI.

## What Changes

- Add a `World` consistency validator to `packages/shared`: a pure function that takes a `World` and returns a list of **tensions** (places where two values disagree), each carrying a plain-language message and suggested field-level fixes — never a bare "invalid," per `NOISEFLOOR-AUTHORING-PLAN.md` §3.4.
- Implement the five rule families named explicitly in D14: RF link budget, SNR→modulation, modulation×width×TDD→capacity, shaper→throughput coherence, and time-series/event coherence. (Device-state and season/geography families from `NOISEFLOOR-AUTHORING-PLAN.md` §3.2 are not in this change — D14 set a floor of five, not all of them at once.)
- Each rule carries a `severity` of `"hard"` (the World is physically impossible) or `"soft"` (unusual, needs a stated cause) per `NOISEFLOOR-AUTHORING-PLAN.md` §3.2.
- Batch in the cheap schema additions D14 named alongside this change:
  - `Case.author: { kind: "curated" | "user"; userId?: string }`, defaulting to `{ kind: "curated" }` so existing case content (case 001) doesn't need updating.
  - `Case.visibility`, defaulting to `"public"` (curated cases live at Public from the start per `NOISEFLOOR-AUTHORING-PLAN.md` §5).
  - `Case.version`'s existing field gets its semantics clarified in a doc comment (ties to future case-versioning on challenge, no type change).
  - `Prompt` gains a `findTheFault` kind, and `Rubric` gains a matching `findTheFault` kind referencing specific validator rule ids — the schema-level hook for `NOISEFLOOR-AUTHORING-PLAN.md` §4.3's fault-finding stage type, whose authoring UI is a later phase.

## Capabilities

### New Capabilities
- `world-consistency-validator`: the pure `validateWorld(world) -> Tension[]` function and its five rule families.

### Modified Capabilities
- `case-content-schema`: `Case` gains `author` and `visibility` fields (both defaulted); `Prompt` and `Rubric` each gain a `findTheFault` variant.

## Impact

- **Affected code**: `packages/shared` only — no API or web app changes. Nothing consumes the validator's output yet (no UI); it's a library capability other work (case-authoring review, Phase 6's builder) will call into later.
- **No breaking change to existing case content** — both new `Case` fields default such that a case object written against the pre-existing schema still validates.
