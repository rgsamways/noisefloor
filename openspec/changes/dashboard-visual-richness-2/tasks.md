## 1. New/extended primitives

- [ ] 1.1 Add `packages/dashboards/src/primitives/LinearMeter.tsx` (`{value, min, max, label, color?}`) — horizontal rounded-full track + filled bar, clamped to [0,1]
- [ ] 1.2 Export it from `packages/dashboards`' index
- [ ] 1.3 Add an optional `fill?: boolean` prop to `LineTrace`; when true, render a gradient-filled area (line color fading to transparent) beneath the polyline down to the chart baseline
- [ ] 1.4 Give `StackedBars`' bar segments rounded top corners (unconditional, no new prop)

## 2. Restyle SignalPanel and DeviceDetails

- [ ] 2.1 `SignalPanel`: rounded corners + shadow on cards; replace each side's two plain-text chain values with `LinearMeter`s over a −100 to −40 dBm range
- [ ] 2.2 `DeviceDetails`: rounded corners + shadow on the card; replace the CINR and cable-SNR text stats with `LinearMeter`s, keeping the existing below-threshold red treatment on the cable-SNR meter

## 3. Restyle LinkCapacityChart

- [ ] 3.1 Rounded corners + shadow on the chart's outer card
- [ ] 3.2 Enable `LineTrace`'s `fill` on the signal trace panel and the 1y capacity line
- [ ] 3.3 Confirm `StackedBars`' rounded-top bars render correctly in the 24h view (no code change expected — just verify)

## 4. Verification

- [ ] 4.1 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` at the repo root; verify all three pass
- [ ] 4.2 Regenerate Playwright visual baselines for `SignalPanel`, `DeviceDetails`, and `LinkCapacityChart` (expected to change — the point of the change, not a regression)
- [ ] 4.3 Visually confirm in a real browser (local dev) that all three components render correctly before regenerating baselines
