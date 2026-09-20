## 1. Schema (packages/shared)

- [ ] 1.1 Add optional `mac`, `txPowerDbm`, `lanSpeedMbps` fields to `DeviceSchema` in `packages/shared/src/schemas/world.ts`; verify a unit test validates a `Device` both with and without them
- [ ] 1.2 Add `expectedRateForCinr(cinrDb: number): 1|2|...|8` to `packages/shared/src/validator/constants.ts`, derived from `MIN_CINR_DB_FOR_RATE`; export it from `packages/shared`'s index; verify a unit test checks a few CINR values against known expected rates

## 2. Primitives and components (packages/dashboards)

- [ ] 2.1 Add `packages/dashboards/src/primitives/SegmentBar.tsx` (`{filledCount, totalCount, expectedCount?}`); verify it renders the right fill/marker for a few inputs
- [ ] 2.2 Add `radio/LinkHeader.tsx`; verify it renders CPE/AP device info and link stats from a `World` alone
- [ ] 2.3 Add `radio/SignalPanel.tsx`; verify the chain-delta computation for both sides
- [ ] 2.4 Add `radio/RateBar.tsx`, using `expectedRateForCinr`; verify its expected marker matches the helper's output
- [ ] 2.5 Add `radio/DeviceDetails.tsx`, with the cable-SNR red-threshold treatment; verify a below-threshold value renders distinctly from an above-threshold one
- [ ] 2.6 Export all four components + `SegmentBar` from `packages/dashboards`' index; verify `pnpm --filter @noisefloor/dashboards typecheck` passes

## 3. Case 001 content (packages/cases)

- [ ] 3.1 Add `mac`/`txPowerDbm`/`lanSpeedMbps` values to case 001's `cpe`/`ap` in `world.ts`; verify the `World` still validates and produces no new hard tensions from `validateWorld`
- [ ] 3.2 Author stage 2 ("Why is the ceiling where it is?" — `radio/LinkHeader`, `SignalPanel`, `RateBar`; `nextCheck` prompt, `options` rubric) per outline §9; insert it into case 001's `stages` array between `s1` and `s4`
- [ ] 3.3 Author stage 3 ("Should this be a dispatch?" — `radio/DeviceDetails`; `action` prompt, `options` rubric) per outline §9; insert it after `s2`
- [ ] 3.4 Verify the full `Case` object validates end to end and `pnpm --filter @noisefloor/cases test` passes with the new stage order (`s1`, `s2`, `s3`, `s4`, `s5`)

## 4. Case player UI (apps/web)

- [ ] 4.1 Extend `CasePlayer`'s `EvidenceView` with a `family === "radio"` branch covering all four new views; verify each renders without throwing for case 001's `World`
- [ ] 4.2 Add gallery entries for the four new components to `DevGallery`; verify `/dev/gallery` renders all of them
- [ ] 4.3 Add a Playwright visual snapshot per new component, matching `link-capacity-chart.visual.spec.ts`'s pattern

## 5. Verification

- [ ] 5.1 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` at the repo root; verify all three pass
- [ ] 5.2 Manually play case 001 end to end (stages 1→2→3→4→5→debrief) against the deployed API, confirming stage 2/3's gating and scoring behave like stages 1/4/5's already-verified path
