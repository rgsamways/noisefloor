## Why

`/console` shipped with no navigation at all — correct at the time, since it matched a mockup that was just the instrument panel and was the only real HUD page in the app. That's about to stop being true: `knowledge-base` (proposed, reviewed, unimplemented) adds `/kb`, and the homepage is about to be converted from its approved static mockup into a real `Landing.tsx`. Three real HUD pages with no way to navigate between them is a broken experience, not a reasonable scope cut anymore.

## What Changes

- A new shared nav component for the public HUD pages, matching the "floor" nav already designed in the approved homepage and KB mockups (`homepage/homepage-laptop.html`/`-phone.html`, `docs/mockups/noisefloor-mock-kb-index.html`/`-detail.html`): active-route highlighting, an accent-colored active item raised above the baseline with a glow tick, muted inactive items, a laptop-only "−104 dBm" / "the floor" bookend, and a mobile 4-column grid variant — one responsive component, not two.
- Nav items: **Home** (`/`), **Console** (`/console`), **KB** (`/kb`).
- Wired into the already-shipped `/console` page (a small edit, not a redesign).
- **Scoped narrower than "convert the site's nav."** `/me` and `/cases` (auth-gated, still light-themed, not being touched by this or the homepage/KB work) keep using the existing `BottomNav.tsx`/`PageShell.tsx` unchanged. This is specifically the nav for the public HUD pages; the old and new navs coexist deliberately, not a migration in progress.
- **Does not build `/kb` or the new `Landing.tsx`.** Those are separate changes (`knowledge-base`, already proposed; a homepage conversion, proposed next) that will each import and use this component once it exists. Linking to `/kb` before it's implemented means that nav item 404s temporarily — an accepted, explicitly-flagged sequencing gap, not something this change works around.

## Capabilities

### New Capabilities
- `hud-shell-nav`: the shared navigation component for the public HUD pages and its presentation/behavior contract.

### Modified Capabilities
(none — `BottomNav`/`PageShell` and their consumers are untouched; `/console`'s existing rendering behavior isn't changed except for the addition of this nav)

## Impact

- **Affected code**: a new component in `apps/web/src/components/`; `apps/web/src/pages/Console.tsx` (adds the nav).
- **Not affected**: `BottomNav.tsx`, `PageShell.tsx`, `/me`, `/cases`, `/cases/:slug`, `/sign-in`.
- **Unlocks**: `knowledge-base` and the homepage conversion can both use this component instead of each inventing their own nav.
