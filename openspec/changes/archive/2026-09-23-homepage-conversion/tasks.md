## 1. Shared demo-telemetry hook

- [x] 1.1 Extract `useDemoLinkTelemetry()` to `apps/web/src/lib/demo-link-telemetry.ts` from `Console.tsx`'s inline scenario/tick logic
- [x] 1.2 Retrofit `Console.tsx` to use the hook, and re-verify `/console` visually (desktop + mobile) to confirm no behavior change

## 2. Landing page rebuild

- [x] 2.1 Rebuild `Landing.tsx`'s top strip: wordmark + "Sign in" link to `/sign-in`, on `HudPageShell`
- [x] 2.2 Rebuild the hero: headline (kept verbatim), new subhead/CTA copy, "Open the console" linking to `/console`, caption "NO ACCOUNT · SIMULATED LINK"
- [x] 2.3 Replace `LinkCapacityChart`/`galleryWorld` with `LinkPanel` fed by `useDemoLinkTelemetry()`
- [x] 2.4 Rebuild the three feature pillars with the approved "One console" / "Two panels" / "Always live" copy and icons
- [x] 2.5 Render `<HudFloorNav />`, confirm Home shows as current
- [x] 2.6 Make the layout responsive per `homepage/homepage-phone.html` — one component, not separate desktop/mobile pages

## 3. Verification

- [x] 3.1 `pnpm --filter @noisefloor/web typecheck`/`build`
- [x] 3.2 `pnpm lint && pnpm typecheck && pnpm test` at the repo root (confirms `packages/shared`, `packages/dashboards`' `crm` family, and the parked case-study pages are unaffected)
- [x] 3.3 Manually load `/` in a dev server at both desktop and mobile viewport widths, confirm the hero visual is live (values change over ~10 seconds without interaction), the layout reflows, and the visual match against the mockups holds
