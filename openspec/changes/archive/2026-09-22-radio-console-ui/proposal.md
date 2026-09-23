## Why

Everything needed to render a believable radio link exists — `packages/console-schema`'s telemetry types, `packages/simulation-engine`'s correlated-movement engine and five faults, and an approved HUD+glow visual direction proven out in static mockups. None of it is visible anywhere in the actual app. The product is the console; until something renders it, nothing built so far is demonstrable as the thing it's for.

## What Changes

- A new `/console` route in `apps/web`, public, no login required — matches the homepage's existing "NO ACCOUNT · SIMULATED LINK" promise.
- A standalone dark-HUD page, **not** wrapped in the existing `PageShell`/`BottomNav` — those render the site's old light-mode chrome, and nothing in the real app has been converted to the HUD look yet (the homepage/KB mockups are still static HTML, not real components). Site-wide nav/shell conversion is a separate, larger piece of work — explicitly deferred, not attempted here.
- Renders the radio-link panel matching `docs/mockups/noisefloor-mock-hybrid.html`: topline (live dot, link identity, chip), the link-quality gauge, LOCAL/REMOTE columns (signal, chain meters, modulation rate bar, mini trend line, severity badge), legend, footer stats — built from real `simulateRadioLink()` output for both sides (two separate calls with different `LinkProfile`/scenario configs, per this engine's existing "per side" design), not fixture data.
- **Live-ticking, not a static snapshot** — handoff §3 is explicit that the panel must show "readings drift and move believably... not static snapshots." A one-shot render would demonstrate almost none of what the simulation engine exists to do.
- Responsive, per the visual-direction doc's standing requirement: one component reflowing LOCAL/REMOTE from side-by-side to stacked, not a separately-maintained mobile variant.
- A new `console` family in `packages/dashboards` (alongside the existing `crm`/`radio`/`nms` families) holding the composed panel component(s), consuming `@noisefloor/console-schema` and reusing dashboard primitives. Route, page shell, and live-tick state live in `apps/web`.
- **Three of the five dashboard primitives get additive, backward-compatible extensions** (`Gauge`, `LinearMeter`, `SegmentBar` — see design.md for the exact props and the reasoning for extending rather than forking): they were built for the old case-study product's light theme and have hardcoded colors/corner-radii that don't work on a dark HUD background. `LineTrace` needs no changes — it's already fully prop-driven.

**Explicitly deferred, not attempted here:**
- The service-layer panel (second panel) — `simulateServiceLayer` exists but isn't rendered yet.
- Any fault/scenario picker UI — this pass hardcodes one demo scenario (see design.md) so there's something worth looking at; a trainee can't yet choose what to see.
- Staleness/greyed-out styling for stale readings.
- Site-wide nav/shell conversion to the HUD look (Home, Me, Cases, sign-in all stay as they are).

## Capabilities

### New Capabilities
- `radio-console-ui`: the console route, its live-ticking behavior, and the composed radio-link panel's presentation contract.

### Modified Capabilities
(none — the primitive extensions in `packages/dashboards` are additive and don't change any existing capability's specified behavior; no existing capability spec covers those primitives directly)

## Impact

- **Affected code**: `apps/web` (new route + page, new dependencies on `@noisefloor/console-schema` and `@noisefloor/simulation-engine`), `packages/dashboards` (new `console` family, extended `Gauge`/`LinearMeter`/`SegmentBar`).
- **Not affected**: `packages/console-schema`, `packages/simulation-engine` (both consumed, not changed), the parked case-study consumers of the extended primitives (`radio/LinkHeader.tsx`, `radio/RateBar.tsx`, etc.) — their existing calls keep rendering identically under the new optional props' defaults.
- **Unlocks**: a follow-up change can add the service-layer panel to the same page; another can add a scenario/fault picker; another can tackle site-wide nav/shell conversion once there's a second HUD page to justify it.
