## Why

`packages/dashboards/src/crm/LinkCapacityChart.tsx` is currently a stub (`PROJECT-PLAN.md` decisions D14/D15): fixed demo numbers, no `World` dependency, built only so the public landing page had a real rendered component to point at instead of a picture. D14 explicitly deferred real dashboard work until `world-validator` landed — it has. This is Phase 1 of `PROJECT-PLAN.md` §4 and `NOISEFLOOR-OUTLINE.md` §13: "the one component that matters," built for real.

## What Changes

- Add shared chart primitives (`StackedBars`, `LineTrace`) in `packages/dashboards/src/primitives/`, per `NOISEFLOOR-OUTLINE.md` §7's stated architecture — one internal chart layer other dashboard components (Phase 3's `radio`/`nms` families) will also draw on later.
- Replace the stub `LinkCapacityChart` wholesale with the real component: renders a `World`'s actual series data via `@noisefloor/shared`'s `resolveSeriesRef`, with a period selector (24h / 1y) per `NOISEFLOOR-OUTLINE.md` §7 — 24h shows stacked used/remaining capacity bars, 1y shows a single capacity line (no used/remaining split exists in `World` for the yearly series) — plus a signal trace panel beneath in both modes, and an optional package-limit line (defaulting to the customer's plan rate).
- Add an `Annotation` type to `packages/shared` and annotation-rendering support to the chart — callouts anchored to a specific series + timestamp, per `NOISEFLOOR-OUTLINE.md` §7's "Annotation mode."
- Add a `/dev/gallery` route in `apps/web` (dev-only, excluded from production builds) rendering the chart against the real series generators with case-001-shaped parameters, so it can be visually developed against reference screenshots per `PROJECT-PLAN.md` decision D4.
- Re-wire the landing page's hero chart to the real component with real generator-backed data, removing its dependency on the stub's internal fixed arrays.
- Add Playwright as a dev dependency (not yet present in `apps/web`) and a first visual regression snapshot of the chart via the gallery route.

## Capabilities

### New Capabilities
- `link-capacity-chart`: the real `crm/LinkCapacityChart` component's rendering behavior — what it draws from a `World`, its period modes, and its annotation support.

### Modified Capabilities
_(none — `landing-page`'s existing requirement that the hero chart be "a rendered component, not a static image" doesn't change; this change swaps the component's internals, which is exactly what that spec anticipated when the stub was flagged as temporary)_

## Impact

- **Affected code**: `packages/dashboards` (new primitives, real `LinkCapacityChart`), `packages/shared` (new `Annotation` schema), `apps/web` (`/dev/gallery` route, `Landing.tsx` updated to feed the real component real data).
- **New dev dependency**: `playwright`, added to `apps/web` for the first time.
- **No API/backend changes.**
