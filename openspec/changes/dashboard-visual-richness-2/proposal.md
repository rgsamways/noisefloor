## Why

`dashboard-visual-richness` applied the new "lively" visual register (rounded corners, shadows, richer color) to `LinkHeader` and `RateBar` only, deliberately deferring `SignalPanel`, `DeviceDetails`, and `crm/LinkCapacityChart` until the pattern was seen live. Robin has now confirmed it and asked to extend it before building any new dashboard components (the `nms/*` family is next in `PROJECT-PLAN.md`) — building new components in the old flat style now would just mean redoing them immediately after.

## What Changes

- Add a `LinearMeter` primitive to `packages/dashboards/primitives` — a horizontal filled bar for a value within a range, the linear counterpart to `Gauge`. Used by both `SignalPanel` (signal chain strength) and `DeviceDetails` (CINR, cable SNR), which is why it's a shared primitive from the start rather than built once and factored out later.
- `LineTrace` gains an optional gradient area-fill beneath its line (fading to transparent), matching the reference screenshots' filled area-chart look. Off by default — existing callers (the 1y capacity line, both signal trace panels) opt in per call site.
- `StackedBars` bars gain rounded top corners.
- `radio/SignalPanel`: rounded/shadowed cards; each side's two signal chains render as `LinearMeter`s instead of plain text.
- `radio/DeviceDetails`: rounded/shadowed card; CINR and cable SNR render as `LinearMeter`s (cable SNR's meter keeps the existing below-threshold red treatment).
- `crm/LinkCapacityChart`: rounded/shadowed outer card; the signal trace panel and the 1y capacity line use `LineTrace`'s new area-fill; `StackedBars`' rounded-top bars apply automatically.

## Capabilities

### Modified Capabilities
- `radio-dashboard`: `SignalPanel` and `DeviceDetails` gain the visual-richness treatment (rounded/shadowed cards, `LinearMeter` for chain/CINR/cable-SNR values). Adds the `LinearMeter` primitive.
- `link-capacity-chart`: gains the visual-richness treatment (rounded/shadowed card, area-filled line traces, rounded-top bars) — no change to its data/behavior contract.

## Impact

- **Affected code**: `packages/dashboards` (`primitives/LinearMeter.tsx` new, `primitives/LineTrace.tsx` and `primitives/StackedBars.tsx` gain props, `radio/SignalPanel.tsx`, `radio/DeviceDetails.tsx`, `crm/LinkCapacityChart.tsx` restyled), `apps/web` (visual snapshots regenerated for the affected components).
- **Scope reductions, explicit**: no new dashboard components in this change (that's the `nms/*` family, next) — this is purely bringing the three remaining existing components in line with `LinkHeader`/`RateBar`'s already-validated style.
- **No breaking change**: `LineTrace`'s fill and `StackedBars`' rounded corners don't change either primitive's existing prop contract in a way that breaks a caller who doesn't opt in (fill is opt-in; rounded corners are a pure style change with no new required prop).
