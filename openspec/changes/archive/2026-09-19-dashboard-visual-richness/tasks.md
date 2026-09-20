## 1. Design-system carve-out

- [x] 1.1 Add a section to `homepage/DESIGN-NOTES.md` documenting that `packages/dashboards` component internals may use rounded corners, shadows, and richer color, distinct from the rest of the site's flat/square/monochrome chrome

## 2. Gauge primitive

- [x] 2.1 Add `packages/dashboards/src/primitives/Gauge.tsx` (`{value, max, label, color?, size?}`) — circular SVG ring, `stroke-dasharray` arc proportional to `value/max`, centered value/label text
- [x] 2.2 Export it from `packages/dashboards`' index

## 3. SegmentBar color scale

- [x] 3.1 Add an optional `segmentColors?: string[]` prop to `SegmentBar`; each filled segment uses `segmentColors[i]` when provided, falling back to `filledColor` when not
- [x] 3.2 Verify `pnpm --filter @noisefloor/dashboards typecheck` passes

## 4. Restyle LinkHeader and RateBar

- [x] 4.1 `LinkHeader`: rounded corners + shadow on device cards; replace the plain-text "Link potential" stat with a `Gauge`
- [x] 4.2 `RateBar`: rounded corners + shadow on cards; pass an 8-color red→indigo scale to `SegmentBar` via `segmentColors`

## 5. Verification

- [x] 5.1 Update `/dev/gallery`'s `LinkHeader`/`RateBar` entries if needed (props unchanged, so likely no code change — just re-check they still render) — confirmed, no changes needed
- [x] 5.2 Regenerate the `radio-family.visual.spec.ts` baselines for `LinkHeader` and `RateBar` (expected to change — this is the point of the change, not a regression). Also caught and fixed `link-capacity-chart.visual.spec.ts` coupling to the whole `/dev/gallery` page (LinkHeader's new Gauge grew the page, shifting that unrelated baseline) — rescoped it to its own `<section>`, matching `radio-family.visual.spec.ts`'s pattern, so future gallery growth won't churn it again
- [x] 5.3 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` at the repo root; verify all three pass
- [x] 5.4 Visually confirm in a real browser (local dev or deployed) that both components render correctly — this is a pure UI change with no automated assertion on "does it look lively" — confirmed locally via screenshots before regenerating baselines
