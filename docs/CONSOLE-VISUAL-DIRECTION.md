# Console visual direction

**Decided 2026-09-21.** Overrides `NOISEFLOOR-OUTLINE.md` §11 ("plain black-and-white... existing homepage mockup stands") for the console — that direction was written for the parked case-study product. This document is the current source of truth for the console's look; the parked outline's design section is not.

## The ask

Robin wants the console to look "a little more futuristic... like something that would be made a few years from now." Color scheme was open.

## How we got here

Four static, self-contained HTML mockups (`docs/mockups/`), no repo code touched, same content/layout across all four so the comparison was purely about material and color:

- `noisefloor-mock-hud.html` — dark canvas, faint grid, monospace type, glowing hairline borders, corner brackets, single flat cyan accent.
- `noisefloor-mock-glass.html` — frosted translucent panels over blurred gradient orbs, violet→blue gradients, rounded/soft.
- `noisefloor-mock-neon.html` — mostly flat/quiet, one lime accent used only on live values.
- `noisefloor-mock-hybrid.html` — **the winner.** HUD's crisp dark foreground (hairlines, corner brackets, monospace) over glass's soft background glow (blurred gradient orbs, gradient fills on the gauge ring and chart), plus a real severity color scale instead of one flat accent.

Between HUD and glass alone, HUD was the stronger base: the instrument-panel register matches the product's actual thesis ("read the instrument, don't memorize the answer") in a way glossy glass doesn't; crisp edges hold up better than blur once a panel is dense with small numbers/meters; high-contrast glow-on-black is more legible outdoors/on cheap screens than frosted translucency, which matters for a tool a tech might check on a phone in bad light; and glass/blur is the dominant "modern SaaS" look right now, which cuts against reading as futuristic rather than familiar. Glass's contribution — the background glow and gradient fills — was worth keeping for richness without inheriting blur's downsides.

## The direction

**Base**: near-black canvas (`#05070a`), thin hairline borders (`#1c2a2e`), corner-bracket accents on the main frame, a pulsing "live" dot, monospace type throughout (JetBrains Mono in the mockup — open to swapping the actual typeface, not the register).

**Depth**: two large, heavily blurred gradient orbs behind the frame (not on any panel) — cyan and blue-violet, low opacity — plus a two-stop gradient (cyan → blue-violet) used on the link-quality gauge ring and as a fill under live line charts. Panels themselves stay flat and opaque, not glassy — the blur lives only in the background.

**Color carries meaning, not decoration.** One consistent severity scale, reused everywhere a reading can be judged healthy or not — not a different color per chart type:
- `--good`  `#2bd47e`
- `--ok`    `#c6ff5e`
- `--warn`  `#ffb443`
- `--bad`   `#ff5e6c`

Applied to: signal/chain meters, the modulation-rate segment bar, and any other field where "is this okay?" is the point of looking at it. A tech should learn "red always means something's wrong" across every panel, not per-widget flavor coloring. Structural/neutral UI (borders, labels, background) stays in the near-black/gray range regardless of severity — color is reserved for values that are actually being judged.

## Mobile

The first four mockups were fixed-width desktop only (`max-width: 960px`, a hard two-column grid) — not an oversight to fix later, just out of scope for a same-content material comparison. Robin caught this and asked for a mobile pass, and to make sure it's carried into the real build, not just noted and dropped.

`docs/mockups/noisefloor-mock-hybrid-mobile.html` is that pass, rendered inside a fixed phone-width frame so it displays correctly regardless of the viewing browser's window size:

- The two LOCAL/REMOTE columns **stack vertically** rather than sitting side by side — this is the one structural change, everything else (severity colors, hairline frame, corner brackets, background glow, gradient gauge/chart fills) carries over unchanged.
- Gauge, type sizes, and padding all scale down modestly.
- A bottom tab bar (`LINK / SERVICE / HISTORY / SETTINGS`) stands in for panel navigation on narrow screens — this isn't a new invention, it's the parked outline's own §11 convention ("navigation on the bottom, because this is noisefloor"), which the visual-direction change doesn't touch — only the black-and-white/flat part of §11 is overridden, not the bottom-nav placement.

**For the real build**: this needs to be responsive (breakpoint-driven), not two separately maintained layouts — one component, CSS that reflows the column stack under some width, not a `LinkView` vs. `LinkViewMobile` split. Flagged here so it's designed in from the start rather than retrofitted.

## Other open questions for the real build

- Exact typeface (JetBrains Mono was a placeholder, not a commitment).
- Whether the severity scale needs a 5th "unknown/stale" state distinct from the four above — relevant once `radio-console-schema`'s per-field staleness (see that change's design.md) actually renders in the UI.
- How this direction extends to the service-layer panel (DHCP/NAT/addressing) and to non-panel chrome (nav, landing page) — not explored in these mockups, which were link-panel only.
