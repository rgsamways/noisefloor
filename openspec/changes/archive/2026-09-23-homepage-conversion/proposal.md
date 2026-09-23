## Why

The live homepage still promotes the parked case-study product — "Play the demo stage" linking to `/cases`, a chart fed by parked gallery data, feature pillars describing case-scoring mechanics ("the score knows it," "Cases get ranked. People don't."). Meanwhile `/console` and `/kb` are real, live-ticking, HUD-styled pages built from approved mockups, and the homepage's own approved mockup (`homepage/homepage-laptop.html`/`-phone.html`) has been sitting unconverted since 2026-09-21. The site's actual front door doesn't yet describe or link to the actual product.

## What Changes

- Rebuild `apps/web/src/pages/Landing.tsx` on `HudPageShell`/`HudFloorNav` (already shipped for `/console` and `/kb`), replacing `PageShell`/`BottomNav`.
- New top strip: wordmark (kept, already HUD-appropriate) + "Sign in" link to `/sign-in` — an accepted cross-theme jump into the still-light-themed sign-in page, same gap `hud-shell-nav` already flagged, not solved here.
- Hero copy from the approved mockup: headline kept verbatim ("Learn to read the instruments." — still the README's own tagline), new subhead and CTA ("Open the console" → `/console`, caption "NO ACCOUNT · SIMULATED LINK"), replacing the case-based copy and its `/cases` link.
- Hero visual: the real `LinkPanel` component fed by `simulateRadioLink`, replacing `LinkCapacityChart` + `packages/shared`'s parked `gallerySeed`/`galleryWorld`. The actual product on the front door, not a fixture chart — and it removes the live homepage's last dependency on parked case-study content.
- **Extract a shared hook** for the demo scenario + 1Hz live-tick logic that `Console.tsx` already has (healthy LOCAL, `foliageGrowthFault`-degraded REMOTE) — Landing needs the identical thing, and duplicating it into a second file is exactly the "second consumer" moment this project already extracted `HudPageShell` at during `knowledge-base`.
- Feature pillars: replace Play/Build/Prove (case-scoring-specific) with the approved mockup's "One console" / "Two panels" / "Always live" copy.
- Responsive per the standard every HUD page has held — one component, not separate desktop/mobile pages.

**Explicitly not in scope:**
- `/sign-in`, `/me`, `/cases`, `/cases/:slug` and their `PageShell`/`BottomNav` chrome — untouched.
- `packages/shared`'s `gallerySeed`/`galleryWorld` and `packages/dashboards`' `crm` family — not removed, just no longer referenced from the live homepage. Still real, working, parked code.
- No site-wide theme/Tailwind config change — same page-scoped styling approach as every other HUD page.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `landing-page`: the homepage's presentation and content now reflect the console pivot instead of the parked case-study product.

## Impact

- **Affected code**: `apps/web/src/pages/Landing.tsx` (full rebuild); a new shared hook (exact location a design.md decision) extracted alongside `Console.tsx`'s existing demo logic.
- **Not affected**: `/sign-in`, `/me`, `/cases`, `/cases/:slug`, `PageShell.tsx`, `BottomNav.tsx`, `packages/shared`, `packages/dashboards`' `crm`/`radio`/`nms` families.
- **Unlocks**: the site's three real HUD pages (`/`, `/console`, `/kb`) are now consistent front-to-back; nothing live still promotes the parked product.
