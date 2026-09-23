## 1. Component

- [x] 1.1 Build `HudFloorNav.tsx`'s static structure matching the mockups: Home/Console/KB items, laptop bookend text, hairline top border, HUD colors/typography
- [x] 1.2 Wire active-route highlighting via `useLocation()` (exact match for `/`, `/console`; prefix match for `/kb`), with the accent-colored raised/glow-tick treatment on the current item
- [x] 1.3 Make the layout responsive: laptop row-with-bookends above a breakpoint, mobile 4-column grid (no bookends) below it, via the same component and markup

## 2. Wire into /console

- [x] 2.1 Render `HudFloorNav` in `apps/web/src/pages/Console.tsx` and add bottom padding so it doesn't overlap the panel
- [x] 2.2 Verify Console is shown as the current item when `/console` is loaded

## 3. Verification

- [x] 3.1 `pnpm --filter @noisefloor/web typecheck`/`build`
- [x] 3.2 `pnpm lint && pnpm typecheck && pnpm test` at the repo root (confirms `BottomNav`/`PageShell` and their consumers are unaffected)
- [x] 3.3 Manually load `/console` in a dev server at both a desktop and a mobile viewport width, confirm the nav renders, reflows, and shows Console as current, and confirm the KB link is present and navigable (a temporary 404 until `knowledge-base` ships is expected, not a bug)
