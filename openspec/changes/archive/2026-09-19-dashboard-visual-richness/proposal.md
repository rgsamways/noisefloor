## Why

Robin compared `radio/LinkHeader`/`RateBar` against real Ubiquiti UISP screenshots and found them flat by contrast — the vendor tools use circular gauge rings, colored data-rate scales, and rounded/shadowed cards, all of which `homepage/DESIGN-NOTES.md` currently bans site-wide ("Square corners everywhere. No shadows, no gradients, no rounded cards."). Robin chose to relax that rule specifically for dashboard components rather than push harder within it — dashboards already carry the app's only color per that same doc ("the only colour on any page is data inside a dashboard component"), so this extends an existing carve-out rather than contradicting the site's identity. Scoped to `LinkHeader` and `RateBar` — the two components directly comparable to the screenshots — rather than a full re-skin of every dashboard component sight unseen.

## What Changes

- **Design-system carve-out**: `homepage/DESIGN-NOTES.md` gains a documented exception — `packages/dashboards` component internals (not site chrome: nav, `PageShell`, `CasePlayer`'s own layout) may use rounded corners, shadows, and richer color than the rest of the app.
- Add a `Gauge` primitive to `packages/dashboards/primitives` (outline §7 already lists it as a planned shared primitive, just never built) — a circular SVG progress ring with a centered value/label.
- `SegmentBar` gains an optional `segmentColors?: string[]` prop (one color per segment index), so a consumer can opt into a colored scale without every `SegmentBar` user being forced into one.
- `radio/LinkHeader`: device cards gain rounded corners and a subtle shadow; the existing plain-text "Link potential: X%" stat becomes a centered `Gauge` ring, matching the real tool's centered-gauge-between-two-device-cards layout.
- `radio/RateBar`: cards gain rounded corners and a subtle shadow; `SegmentBar` is given an 8-color scale (red→blue) via `segmentColors`, matching the real tool's colored modulation-rate track.

## Capabilities

### Modified Capabilities
- `radio-dashboard`: `LinkHeader`'s link-potential stat becomes a `Gauge`; `RateBar`'s segment bar gains a color scale; both gain rounded/shadowed cards. Adds the `Gauge` primitive.

## Impact

- **Affected code**: `homepage/DESIGN-NOTES.md` (documented carve-out), `packages/dashboards` (`primitives/Gauge.tsx` new, `primitives/SegmentBar.tsx` gains a prop, `radio/LinkHeader.tsx` and `radio/RateBar.tsx` restyled), `apps/web` (visual snapshots regenerated for these two components).
- **Scope reductions, explicit**: `SignalPanel`, `DeviceDetails`, `crm/LinkCapacityChart`, `StackedBars`, and `LineTrace` are **not** restyled in this change — they stay in the current flat/square style until this new visual language has actually been seen live and validated on `LinkHeader`/`RateBar` first.
- **No breaking change**: `SegmentBar`'s new prop is optional; existing callers (none besides `RateBar` currently) are unaffected if they don't pass it.
