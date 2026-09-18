## 1. Schema additions

- [ ] 1.1 Add `Case.author` (`{kind: "curated"|"user"; userId?}`, default `{kind:"curated"}`) and `Case.visibility` (default `"public"`) to `packages/shared/src/schemas/case.ts`; verify existing `case.test.ts` fixtures still validate unchanged, plus a new test for both defaults and for an explicit user/private case
- [ ] 1.2 Add a doc comment on `Case.version` clarifying its case-versioning semantics (ties to future challenge-driven version bumps, no type change); verify `pnpm --filter @noisefloor/shared typecheck` passes
- [ ] 1.3 Add `findTheFault` to `Prompt` (free text) and to `Rubric` (`{kind: "findTheFault", tensionRuleIds: string[]}`) in `packages/shared/src/schemas/prompt.ts`/`rubric.ts`; verify a stage using both validates

## 2. Validator core types

- [ ] 2.1 Add `Tension`/`Resolution`/`Severity` types (and Zod schemas, for consistency with the rest of `packages/shared`) in `packages/shared/src/validator/types.ts`; verify `pnpm --filter @noisefloor/shared typecheck` passes
- [ ] 2.2 Add `packages/shared/src/validator/constants.ts` with named, commented threshold values for each rule family below, each flagged as pending domain review per `design.md`

## 3. Rule families

- [ ] 3.1 RF link budget (`packages/shared/src/validator/rules/rf-link-budget.ts`): chain-imbalance-over-3dB soft tension, signal-below-expected soft tension; verify one passing and one failing unit test per check
- [ ] 3.2 SNR-to-modulation (`.../rules/snr-modulation.ts`): CINR-vs-signal/noise consistency (soft), rate-exceeds-CINR (hard), rate-below-CINR (soft); verify unit tests per spec scenario
- [ ] 3.3 Modulation×width×TDD-to-capacity (`.../rules/capacity-budget.ts`): capacity-outside-achievable-band (hard), unexplained direction asymmetry (soft); verify unit tests per spec scenario
- [ ] 3.4 Shaper-to-throughput (`.../rules/shaper-throughput.ts`): throughput-exceeds-shaper-cap-post-event (hard), suspiciously-low-shaper-value (soft, kbit/s-mistake hint); verify unit tests per spec scenario, including the case-001-style shaper-collapse shape
- [ ] 3.5 Event coherence (`.../rules/event-coherence.ts`): every `WorldEvent` has a corresponding series effect at/after its timestamp (hard if not); verify unit tests per spec scenario

## 4. Aggregation and exports

- [ ] 4.1 Add `validateWorld(world): Tension[]` in `packages/shared/src/validator/index.ts`, running all five rule families and flattening results; verify a fully-consistent `World` fixture returns `[]`
- [ ] 4.2 Export the validator (types + `validateWorld`) from `packages/shared/src/index.ts`; verify `pnpm --filter @noisefloor/shared typecheck` passes
- [ ] 4.3 Build a `World` fixture from case 001's actual described values (`NOISEFLOOR-OUTLINE.md` §9) and verify `validateWorld` returns no *hard* tensions against it — case 001 is meant to be a physically sound (if narratively tricky) scenario

## 5. Verification

- [ ] 5.1 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` at the repo root; verify all three pass
- [ ] 5.2 Confirm every scenario in `specs/world-consistency-validator/spec.md` and `specs/case-content-schema/spec.md` has a passing corresponding unit test
