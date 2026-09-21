# noisefloor — homepage design notes

**Reworked 2026-09-21** to carry the console's HUD + glow visual direction
(`docs/CONSOLE-VISUAL-DIRECTION.md`) onto the landing page, and to drop copy that
promoted the parked case-study product (`docs/NOISEFLOOR-CONSOLE-HANDOFF.md`).
The previous version of this page (monochrome chrome, case-001 capacity chart hero,
Play/Build/Prove pillars) is superseded — it was designed for the case-based product,
before the pivot.

Reference files: `homepage-laptop.html` (1440 wide) and `homepage-phone.html` (390
wide). Static, self-contained mockups (plain HTML/CSS/inline SVG, no build step) —
same convention as `docs/mockups/`. Read them for look, layout, and copy, then
implement the landing route in `apps/web` with React + Tailwind v4 + `lucide-react`.
Do not copy the HTML in.

**Not yet reviewed with Robin — copy and nav are provisional**, same "mockup first,
review before build" pattern as the rest of this pivot. Two things in particular need
a decision before implementation:
- The bottom nav swaps `Cases` for `Console`, since Cases is the parked product's
  route and no console route exists in `apps/web` yet (checked: current routes are
  `/`, `/sign-in`, `/me`, `/cases`, `/cases/:slug`; `Gotchas` has a nav entry but no
  route either — it was already aspirational before this rework).
- The three feature pillars ("One console" / "Two panels" / "Always live") are
  written directly off the handoff doc's phase-one bullets (§3), replacing the old
  Play/Build/Prove pillars, which described case-product mechanics (commit-before-
  reveal scoring, the builder, case challenges) that don't apply here.

## The idea

Same structural idea as before, carried over rather than reinvented: the nav is
the floor, sitting at the bottom of the page like the noise floor on a spectrum
chart, with everything above it as signal. What changed is that the whole page now
reads as an instrument panel rather than a plain document — chrome and hero both
adopt the console's dark HUD register, because the product being sold *is* the
console, not a separate case-reading exercise.

## Palette, type, materials

Pulled directly from `docs/CONSOLE-VISUAL-DIRECTION.md` — this page does not define
its own material language, it reuses the console's:

- Near-black canvas `#05070a`, hairline borders `#1c2a2e`, primary text `#d7e6e2`,
  dimmed body text `#9fb3af` (new — the direction doc's `--muted` `#5a726e` is too
  dim for paragraph copy at landing-page reading sizes; `--muted` itself stays for
  captions/labels), gradient accent pair `#3dffc4` → `#7c9bff`.
- Severity scale (`--good` `#2bd47e`, `--ok` `#c6ff5e`, `--warn` `#ffb443`, `--bad`
  `#ff5e6c`) appears only inside the console preview panel, on the local/remote
  signal readings — exactly where the direction doc says color should carry
  meaning, not decoration. Nothing else on the page uses it.
- Two blurred gradient orbs (cyan, blue-violet) behind the page content, same as
  the console mockups — depth lives in the background, panels stay flat.
- Monospace throughout (JetBrains Mono, placeholder typeface per the direction
  doc — not a commitment), including the H1. One word of the headline
  (`instruments.`) carries the accent gradient as text-fill, echoing the gradient
  used on judged numeric values (the gauge reading) elsewhere in the console — the
  only other place on this page gradient text appears.
- Corner brackets and hairline frame from the HUD register wrap the console
  preview panel specifically, not the whole page — matches how the mockups apply
  them to the instrument frame, not arbitrary content blocks.
- Square corners, no shadows/blur on panels themselves (only the background orbs
  blur) — same flat-panel rule as the console mockups.

## The console preview (the one hero visual)

Where the old page had a static bar chart of case 001's capacity data, this page
has a compressed version of the actual console panel — gauge, LOCAL/REMOTE
severity columns, legend — built from the same markup pattern as
`docs/mockups/noisefloor-mock-hybrid.html`, minus the live-updating jitter script
(the mockup's `setInterval` tick isn't reproduced here; static values are enough
to sell the look on a landing page, but nothing stops a real implementation from
running the live version — worth deciding when this becomes a real component,
since packages/dashboards/src/primitives already has `Gauge`, `LinearMeter`, and
`SegmentBar` to build it from).

## The floor (bottom nav)

Same structural rules as before — fixed to viewport bottom, active item raised
above the baseline with a glowing tick beneath it (never a pill/background/badge),
laptop-only `−104 dBm` / `the floor` bookends — just recolored: inactive items in
`--muted`, active item and its tick in `--accent` with a soft glow
(`drop-shadow`/`box-shadow`), background a near-opaque near-black instead of
paper white.

## General

- Real `<a>` elements; `aria-current="page"` on the active nav item; `aria-label`
  should be added to icon-only controls when this becomes real markup (the mockups
  keep visible labels throughout, so it wasn't needed here).
- Copy is placeholder-real. Keep the headline `Learn to read the instruments.`
  unless told otherwise — it's also the tagline in the repo root `README.md`, so
  changing it here without changing it there would create drift.
