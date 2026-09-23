## Context

See proposal.md for motivation. `apps/web/src/components/BottomNav.tsx`/`PageShell.tsx` are the existing pattern for site nav, but they render the old light theme and wrap children in a fixed layout — not reusable here without dragging the old theme into the new HUD pages. `homepage/homepage-laptop.html`/`-phone.html` and `docs/mockups/noisefloor-mock-kb-index.html`/`-detail.html` already fully specify the new nav's look (the "floor": accent-colored active item raised with a glow tick, muted inactive items, a laptop-only `−104 dBm`/"the floor" bookend, a mobile 4-column grid) — this change's job is to make that real, not redesign it.

## Goals / Non-Goals

**Goals:**
- One component, `HudFloorNav`, usable by any public HUD page (Console today; KB and the new Home once those land).
- Faithful to the mockups' exact visual treatment, same standard this project has held for every HUD page so far.

**Non-Goals:**
- No change to `BottomNav`/`PageShell` or their consumers (`/me`, `/cases`, `/cases/:slug`).
- No account/sign-in item in this nav — see Decisions.
- No building `/kb` or the new `Landing.tsx` — this change only produces the component and wires it into the already-shipped `/console`.

## Decisions

**Three items: Home, Console, KB. No "Me."** The homepage mockup itself separates these concerns: a top-strip "Sign in" link handles account access, independent of the bottom floor nav, which is reserved for primary content destinations. Dropping "Me" from this nav isn't removing a capability — sign-in/account access is a top-strip concern that belongs to whichever change converts the homepage's top strip into real code, not to the floor nav itself. `/console` doesn't get a top strip in this change either (out of scope, unchanged from its current shipped state) — so for now, `/console` has no account-access affordance at all, same as today; that gap closes naturally once the homepage conversion's top strip exists and a visitor can reach it via the Home nav item.

**New component: `apps/web/src/components/HudFloorNav.tsx`.** Not a `PageShell`-style wrapper — each HUD page's background/layout differs deliberately (per-page glow orbs, framing), unlike the old site's uniform shell. `HudFloorNav` is a standalone element a page places directly in its own JSX, typically at the end, matching how the mockups embed the floor inline in each page's markup rather than through a shared layout wrapper.

**Active-route detection via `useLocation()`, prefix-matched for KB.** `/console` matches exactly; `/kb` matches on `pathname.startsWith("/kb")` so a future `/kb/:slug` detail page still shows KB as current — same pattern `BottomNav` would need for `/cases/:slug`, applied here first since KB's detail route is the immediate case.

**`/console` gets bottom padding added to avoid the nav overlapping its panel**, mirroring `PageShell`'s existing `pb-[72px] md:pb-16` treatment for the old nav — same idea, new component.

## Risks / Trade-offs

- **[Risk] Linking to `/kb` before `knowledge-base` is implemented means that nav item 404s in the meantime.** → **Mitigation**: explicitly accepted in proposal.md — sequencing gap, not a defect; resolves itself once `knowledge-base` ships, which is already proposed and reviewed.
- **[Risk] Dropping "Me" from the HUD nav could read as removing account access if the homepage conversion's top-strip sign-in link doesn't land in the same timeframe.** → **Mitigation**: flagged here explicitly so whoever proposes the homepage conversion next treats the top-strip sign-in link as required, not optional polish.
