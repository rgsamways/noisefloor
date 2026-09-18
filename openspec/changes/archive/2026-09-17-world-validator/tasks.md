## 1. Schema additions

- [x] 1.1 Add `Case.author` (`{kind: "curated"|"user"; userId?}`, default `{kind:"curated"}`) and `Case.visibility` (default `"public"`) to `packages/shared/src/schemas/case.ts`; verify existing `case.test.ts` fixtures still validate unchanged, plus a new test for both defaults and for an explicit user/private case
- [x] 1.2 Add a doc comment on `Case.version` clarifying its case-versioning semantics (ties to future challenge-driven version bumps, no type change); verify `pnpm --filter @noisefloor/shared typecheck` passes
- [x] 1.3 Add `findTheFault` to `Prompt` (free text) and to `Rubric` (`{kind: "findTheFault", tensionRuleIds: string[]}`) in `packages/shared/src/schemas/prompt.ts`/`rubric.ts`; verify a stage using both validates

## 2. Validator core types

- [x] 2.1 Add `Tension`/`Resolution`/`Severity` types (and Zod schemas, for consistency with the rest of `packages/shared`) in `packages/shared/src/validator/types.ts`; verify `pnpm --filter @noisefloor/shared typecheck` passes
- [x] 2.2 Add `packages/shared/src/validator/constants.ts` with named, commented threshold values for each rule family below, each flagged as pending domain review per `design.md` — five specific values (chain imbalance 3dB, 6X/8X CINR anchors, 20MHz/6X capacity reference, sub-1Mbit/s shaper threshold) were reviewed and confirmed by Robin during this change; the rest are Claude's interpolation between those anchors, still flagged

## 3. Rule families

- [x] 3.1 RF link budget (`packages/shared/src/validator/rules/rf-link-budget.ts`): chain-imbalance-over-3dB soft tension only — the distance/frequency expected-signal check is descoped from this change (see spec.md), `World` has no TX power/antenna gain to compute it from; verify one passing and one failing unit test
- [x] 3.2 SNR-to-modulation (`.../rules/snr-modulation.ts`): CINR-vs-signal/noise consistency (soft), rate-exceeds-CINR (hard), rate-below-CINR (soft); verify unit tests per spec scenario
- [x] 3.3 Modulation×width×TDD-to-capacity (`.../rules/capacity-budget.ts`): a wide soft/hard band per direction, deliberately generous (see constants.ts — case 001's own down/up split needs a wider band than a naive width×rate formula gives); verify unit tests per spec scenario
- [x] 3.4 Shaper-to-throughput (`.../rules/shaper-throughput.ts`): shaper-labeled event followed by a sustained sub-1-Mbit/s throughput plateau (soft, kbit/s-mistake hint), computed from series shape only — no stored cap value to check an "exceeds cap" case against, see spec.md; verify unit tests per spec scenario, including the case-001-style shaper-collapse shape — found and fixed a real timing bug in the process: checking only the points *immediately* after an event misses a delayed effect (case 001's shaper change at 11:52 doesn't actually collapse throughput until 11:56); fixed to check the settled tail of the post-event window instead
- [x] 3.5 Event coherence (`.../rules/event-coherence.ts`): every `WorldEvent` has a corresponding series effect at/after its timestamp (hard if not); verify unit tests per spec scenario — hit the same delayed-effect timing bug as 3.4 and fixed it the same way (check the whole remainder of the series after the event, not a fixed small lookahead)

## 4. Aggregation and exports

- [x] 4.1 Add `validateWorld(world): Tension[]` in `packages/shared/src/validator/index.ts`, running all five rule families and flattening results; verify a fully-consistent `World` fixture returns `[]` — note: signature is `validateWorld(world, seed)`, not `validateWorld(world)` alone; two of the five rules (shaper-throughput, event-coherence) need to resolve generator-backed `SeriesRef`s, which requires a seed the `World` itself doesn't carry
- [x] 4.2 Export the validator (types + `validateWorld`) from `packages/shared/src/index.ts`; verify `pnpm --filter @noisefloor/shared typecheck` passes
- [x] 4.3 Build a `World` fixture from case 001's actual described values (`NOISEFLOOR-OUTLINE.md` §9) and verify `validateWorld` returns no *hard* tensions against it — scoped to the headline RF/capacity/shaper values plus the one fully-modeled event pair (shaper change + collapse); the other four events (reconnect/restore/reboot) aren't included since they don't have a modeled series effect yet (Phase 2 case-authoring work)

## 5. Verification

- [x] 5.1 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` at the repo root; verify all three pass — 44 tests passing, lint and typecheck clean across all packages
- [x] 5.2 Confirm every scenario in `specs/world-consistency-validator/spec.md` and `specs/case-content-schema/spec.md` has a passing corresponding unit test — confirmed; two scenarios were narrowed mid-implementation (RF link budget's distance check, shaper's exceeds-cap check) when the data they needed turned out not to exist in `World` yet, and the spec was amended to match rather than left aspirational
