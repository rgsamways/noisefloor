## Context

See proposal.md for motivation. `homepage/homepage-laptop.html`/`-phone.html` are the approved visual target — this change's job is to make that mockup real, same standard as `/console` and `/kb`. `apps/web/src/pages/Console.tsx` already has the exact demo-scenario + 1Hz live-tick logic this page needs (see `radio-console-ui`'s design.md for why that scenario picks `foliageGrowthFault` over `cableDegradationFault`/`rainFadeFault`).

## Goals / Non-Goals

**Goals:**
- Make the approved mockup real, with the hero visual backed by actual simulated telemetry, not a fixture.
- Extract the demo-telemetry logic `Console.tsx` already has into a shared hook, rather than duplicating it — the same "second consumer" reasoning that justified extracting `HudPageShell` during `knowledge-base`.
- Drop the live homepage's last dependency on parked case-study content (`packages/shared`'s `gallerySeed`/`galleryWorld`, `packages/dashboards`' `LinkCapacityChart`).

**Non-Goals:**
- No change to `/sign-in`, `/me`, `/cases`, `/cases/:slug`, `PageShell.tsx`, `BottomNav.tsx`.
- No removal of `packages/shared`'s gallery data or `packages/dashboards`' `crm` family — still real, working, parked code; just no longer referenced from the live homepage.
- No site-wide theme/Tailwind config change.
- No fault/scenario picker, no service-layer panel on the homepage — same deferrals `radio-console-ui` already made, inherited here since the hero visual is the same `LinkPanel`.

## Decisions

**Extract `useDemoLinkTelemetry()` to `apps/web/src/lib/demo-link-telemetry.ts`.** Takes no arguments, returns `{ local: RadioLinkTelemetry; remote: RadioLinkTelemetry }`, encapsulating the fixed demo `LinkProfile`s, the `foliageGrowthFault`-on-REMOTE scenario, a captured `baseTimeIso`, and the 1 Hz `setInterval` tick — exactly what `Console.tsx` already does inline. `Console.tsx` is retrofit onto this hook (behavior-identical, re-verified visually); `Landing.tsx` uses it too. `apps/web/src/lib/` already holds this kind of shared, non-presentational logic (`auth-client.ts`, `gallery-world.ts`), so no new directory convention is introduced.

**Hero visual is the real `LinkPanel`, sized within the hero's grid column, not a separate compressed variant.** `LinkPanel` has no "compact mode" prop and this change doesn't add one — it renders at whatever width its container gives it (matching how the mockup's own hero panel is a smaller rendering of the same instrument, not a functionally different one). If a genuinely different hero-specific presentation is ever needed, that's a `LinkPanel` prop addition to make later, not something to solve by forking a second component now.

**Feature pillar icons: `LayoutDashboard` (One console), `Rows3` (Two panels), `Activity` (Always live)** — all existing `lucide-react` icons, matching the library already used by `BottomNav`/`HudFloorNav`/the old `Landing.tsx`.

**Top strip's "Sign in" link stays a plain link to `/sign-in`, no visual treatment change.** The cross-theme jump into the still-light-themed sign-in page is an accepted, already-documented gap (`hud-shell-nav` design.md) — not solved here, since fixing it means converting `/sign-in` itself, which is out of scope.

## Risks / Trade-offs

- **[Risk] The live homepage's hero now runs a second independent instance of the 1 Hz simulation tick (once on `/`, potentially another on `/console` if a visitor navigates between them in the same session)** — two intervals, two independent `RadioLinkTelemetry` streams, not shared state. → **Mitigation**: acceptable — each page's `LinkPanel` is meant to be self-contained, and nothing currently needs the two pages' demo data to be in sync with each other. Revisit only if that ever becomes a real requirement (e.g. a persistent app-level telemetry provider), not before.
- **[Risk] Dropping `LinkCapacityChart`/`galleryWorld` from the live homepage means that code path is now only exercised by the parked case-study pages/tests, not the homepage.** → **Mitigation**: intentional — that's exactly the point of removing the dependency; the parked pages and their own tests remain the coverage for that code, unchanged by this proposal.
