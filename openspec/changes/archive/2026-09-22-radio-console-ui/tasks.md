## 1. Primitive extensions (packages/dashboards)

- [x] 1.1 Extend `Gauge` with `trackColor?`, `gradient?: [string, string]`, `glow?`, `valueColor?`, each defaulting to current behavior when omitted
- [x] 1.2 Extend `LinearMeter` with `trackColor?`, `square?`, `labelClassName?`, `valueClassName?`, each defaulting to current behavior when omitted
- [x] 1.3 Extend `SegmentBar` with `borderColor?`, `expectedBorderColor?`, `square?`, each defaulting to current behavior when omitted
- [x] 1.4 Run `apps/web/e2e/radio-family.visual.spec.ts` and confirm it still passes unchanged (parked case-study consumers render identically)

## 2. Console family (packages/dashboards/src/console)

- [x] 2.1 Add `severity.ts`: the four severity colors, `linkQualityToSeverity(pct)` with the documented thresholds
- [x] 2.2 Build `LinkPanel.tsx`'s static structure (frame, corner brackets, topline, gauge, LOCAL/REMOTE columns, legend, footer) matching `docs/mockups/noisefloor-mock-hybrid.html`, using the extended primitives with HUD colors/gradient/glow/square props
- [x] 2.3 Wire `LinkPanel` to accept `{ local: RadioLinkTelemetry; remote: RadioLinkTelemetry }` and render real field values (no more mockup placeholder numbers)
- [x] 2.4 Add the client-side rolling-history arrays feeding each column's `LineTrace`
- [x] 2.5 Make the layout responsive: LOCAL/REMOTE side-by-side above a breakpoint, stacked below it, via Tailwind classes on the same markup
- [x] 2.6 Export `LinkPanel` (and `severity.ts`'s public functions) from `packages/dashboards/src/index.ts`

## 3. Console page and route (apps/web)

- [x] 3.1 Add `@noisefloor/console-schema` and `@noisefloor/simulation-engine` as dependencies of `apps/web`
- [x] 3.2 Add a JetBrains Mono `<link>` to `apps/web/index.html`
- [x] 3.3 Build `apps/web/src/pages/Console.tsx`: full-viewport dark background + glow orbs (translated from the mockup), scoped JetBrains Mono, mounting `LinkPanel`
- [x] 3.4 Set up the demo scenario: LOCAL healthy `LinkProfile`/no fault, REMOTE the same profile shape with `cableDegradationFault` triggered far in the past with a short ramp (already plateaued at load)
- [x] 3.5 Implement the 1 Hz live-tick (`setInterval`, cleaned up on unmount) advancing `atSec` and re-deriving both `simulateRadioLink` outputs each tick
- [x] 3.6 Wire `/console` into `App.tsx`, public, outside `RequireAuth`, not wrapped in `PageShell`

## 4. Verification

- [x] 4.1 `pnpm --filter @noisefloor/dashboards typecheck`/`build`
- [x] 4.2 `pnpm --filter @noisefloor/web typecheck`/`build`
- [x] 4.3 Run `apps/web/e2e/radio-family.visual.spec.ts` (and the repo's other visual specs) and confirm all pass
- [x] 4.4 `pnpm lint && pnpm typecheck && pnpm test` at the repo root
- [x] 4.5 Manually load `/console` in a dev server at both a desktop and a mobile viewport width, confirm the layout reflows, readings visibly change over ~10 seconds without interaction, and the visual match against `docs/mockups/noisefloor-mock-hybrid.html`/`-mobile.html` holds
