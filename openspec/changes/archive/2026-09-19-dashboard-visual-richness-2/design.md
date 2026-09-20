## Context

See `proposal.md` and `dashboard-visual-richness`'s own design.md (the original carve-out and its `Gauge`/`SegmentBar` precedent). This extends the same visual register to the three components that change explicitly deferred.

## Goals / Non-Goals

**Goals:**
- `SignalPanel`, `DeviceDetails`, and `crm/LinkCapacityChart` visually consistent with `LinkHeader`/`RateBar`.
- `LinearMeter`, the linear counterpart to `Gauge` — outline §7 doesn't name it explicitly, but the reference screenshots' chain-strength bars are exactly this shape, and it's clearly reusable across `SignalPanel` and `DeviceDetails` from the outset.

**Non-Goals:**
- New dashboard components (`nms/*`) — next change, not this one.
- Converting every `DeviceDetails` stat to a meter. Only CINR and cable SNR become `LinearMeter`s — the ones a real dashboard actually shows as bars. Mode/firmware/uptime/memory/CPU/distance/noise-floor/cable-length/LAN/GPS stay as plain text; turning every number into a bar would be visual noise, not fidelity.

## Decisions

**`LinearMeter` shape**: `{ value: number, min: number, max: number, label: string, color?: string }` — a rounded-full track (light gray) with a filled rounded-full bar sized to `(value-min)/(max-min)`, clamped to [0,1], with `label` and `value` as text above or beside it. Mirrors `Gauge`'s prop shape (`value`/`max`/`label`/`color`) for consistency between the two primitives, with `min` added since dBm values aren't naturally 0-based the way a percentage is.

**`SignalPanel`'s chain meters use a fixed −100 to −40 dBm range.** Matches the existing min/max convention already used for the signal trace panel's own axis in `LinkCapacityChart` (`Math.min(...signalValues, -100)` / `Math.max(...signalValues, -40)`) — one consistent "typical signal range" assumption across the two components rather than two independently-guessed ranges.

**`DeviceDetails`'s cable-SNR meter keeps its own component-local threshold, not a shared range with the chain meters.** Cable SNR (an ethernet-cable metric, roughly 0-40 dB in practice) and RF chain signal (dBm, roughly −100 to −40) are different units and different scales — sharing a range between them would misrepresent one or the other. Each meter gets the range appropriate to what it's actually showing.

**`LineTrace`'s fill is a prop, not a separate component.** `fill?: boolean` (default `false`); when true, an SVG `<linearGradient>` (the line's color fading to transparent) fills the area between the polyline and the chart's baseline, via a `<path>` sharing the same point coordinates. Keeping it on `LineTrace` itself (rather than a new `AreaTrace` primitive) avoids duplicating the same coordinate-generation logic in two primitives for what's visually the same line with an optional fill underneath.

**`StackedBars`' rounded corners are unconditional, not a prop.** Every current and planned use of `StackedBars` is exactly the LinkCapacityChart 24h capacity bars — there's no scenario where a caller would want the old sharp-cornered look once the surrounding card itself is rounded. A single visual-consistency choice, not a per-caller option nobody would ever set differently.

## Risks / Trade-offs

- **[Risk] `LinearMeter`'s fixed dBm range (−100 to −40) could clip or misrepresent a future case with genuinely unusual signal values.** → **Mitigation**: the value is clamped, not hidden — an out-of-range meter just shows fully empty or full, and the actual number is still shown as text alongside it. Revisit if a future case's real numbers make this look wrong.

## Migration Plan

Additive/opt-in only: new primitive, new opt-in `LineTrace` prop, unconditional (non-breaking) style change to `StackedBars`, restyled JSX in three existing components with unchanged public prop contracts. Playwright visual baselines for all three components (plus anything sharing `/dev/gallery`'s page-level screenshot, per `dashboard-visual-richness`'s own lesson about that coupling) are expected to change and get regenerated as part of this change.
