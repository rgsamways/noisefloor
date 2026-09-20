## Context

See `proposal.md`. Every dashboard component built so far (`crm/LinkCapacityChart`, the `radio/*` family) follows the site-wide flat/square/monochrome rule in `homepage/DESIGN-NOTES.md`. Robin explicitly asked to break from that rule for dashboards after comparing `LinkHeader`/`RateBar` to real Ubiquiti UISP screenshots.

## Goals / Non-Goals

**Goals:**
- A documented, explicit design-system exception (not a silent one-off) so future dashboard work knows the rule changed and why.
- `Gauge`, a primitive outline §7 already planned but never built.
- `LinkHeader` and `RateBar` visually closer to the real tool's "lively" feel — rounded cards, a shadow, a circular gauge, a colored rate scale — without inventing data the `World` schema doesn't have.

**Non-Goals:**
- Restyling `SignalPanel`, `DeviceDetails`, `crm/LinkCapacityChart`, or the `StackedBars`/`LineTrace` primitives now. This is deliberately a first pass on the two components Robin actually compared against reference screenshots — extending the pattern to the rest is real, follow-on work once this one's been seen live, not assumed now.
- A generalized "theme" system (dark mode, per-tenant palettes, etc.) — out of scope, not requested.

## Decisions

**The carve-out lives in `homepage/DESIGN-NOTES.md` itself, not a separate doc.** That file is already the single source of truth for the site's visual identity and already contains the one prior carve-out this extends ("the only colour on any page is data inside a dashboard component"). Adding to it in place keeps one canonical visual-identity doc instead of two that could drift apart.

**`Gauge` is a circular SVG ring, not a canvas/library gauge.** `{ value: number, max: number, label: string, color?: string, size?: number }` — a background track circle (light gray stroke) plus a foreground arc drawn via `stroke-dasharray`/`stroke-dashoffset` sized to `value/max`, rounded linecap, with the numeric value and label centered inside. Matches `StackedBars`/`LineTrace`'s own "plain SVG, no charting library" precedent (`NOISEFLOOR-OUTLINE.md` §7) — the "livelier" look comes from the shape and rounded stroke cap, not from pulling in a gauge library.

**`LinkHeader`'s new `Gauge` shows `link.linkPotentialPct`, not a fabricated per-side throughput number.** The real UISP screenshot's two ring gauges show live current-throughput-vs-capacity per side — a value our `World` schema has no field for (no live "current throughput" separate from `capacityDownMbps`/`capacityUpMbps`, which are already shown as plain text). Rather than inventing a field just to fill a ring, the one `World` value that's already gauge-shaped (a single 0-100% link-level number, currently rendered as flat text) becomes the ring. Honest constraint over cosmetic completeness.

**`RateBar`'s color scale is a fixed 8-entry array, not a computed gradient.** `["#e5484d", "#f2994a", "#f2c94c", "#a8c93c", "#2bb673", "#2ba8a8", "#3b78c4", "#6c5ce7"]` (red through indigo across the eight rate tiers) — hardcoded in `RateBar.tsx`, passed to `SegmentBar` via the new `segmentColors` prop. Not a semantic "good/bad" scale (a low rate isn't necessarily bad — it might be the correct rate for a long, noisy link) — purely the same kind of visual-only scale the real tool uses on its modulation-rate track.

**`SegmentBar` keeps `filledColor` as a fallback.** When `segmentColors` isn't passed, behavior is unchanged (all existing/future callers that don't need a color scale aren't forced into one) — matches the "no consumer forced into new behavior" bar every additive prop in this codebase has met so far.

## Risks / Trade-offs

- **[Risk] Two visual languages now coexist inside `packages/dashboards`** (the four untouched components' flat style vs. `LinkHeader`/`RateBar`'s new one) **until the rest catch up.** → **Mitigation**: accepted and explicit (see Non-Goals) — better to validate the new language on two components live than guess it right across six at once.
- **[Risk] `RateBar`'s color scale could be read as a quality/severity signal it isn't.** → **Mitigation**: documented directly in code and here; revisit if it causes real confusion once seen live.

## Migration Plan

Additive only: new primitive, new optional prop, restyled JSX in two existing components (no prop/behavior changes to their public contracts — `LinkHeader`/`RateBar` still take just `{ world: World }`). Existing Playwright visual baselines for these two components are expected to change and get regenerated as part of this change, not a regression.
