## Context

See proposal.md for scope and motivation. Consumes `@noisefloor/console-schema` (`RadioLinkTelemetry`, `LinkProfile`) and `@noisefloor/simulation-engine` (`simulateRadioLink`, `windMisalignmentFault`/`rainFadeFault`/`cableDegradationFault`/`foliageGrowthFault`/`interferenceFault`), both already implemented and unaffected by this change. Visual target is `docs/CONSOLE-VISUAL-DIRECTION.md` and `docs/mockups/noisefloor-mock-hybrid.html`/`-mobile.html` exactly — this change's job is to make that mockup real, not reinterpret it.

`packages/dashboards/src/primitives/{Gauge,LinearMeter,SegmentBar,LineTrace}.tsx` are the candidate building blocks. Inspecting them directly: `LineTrace` is fully prop-driven (explicit `color`, no theme coupling) and needs no changes. `Gauge`, `LinearMeter`, and `SegmentBar` were built for the old case-study product's light theme and have values that don't work on a dark HUD background — a flat grey `#e5e5e5` track (`Gauge`, `LinearMeter`), Tailwind theme tokens (`text-muted`, `border-foreground`) tied to the old theme's CSS variables, and rounded corners (`rounded-full`, `rounded-sm`) where the HUD register is flat/square with hairline borders. `apps/web/e2e/radio-family.visual.spec.ts` is an existing Playwright visual-regression test covering the parked case-study components (`radio/LinkHeader`, etc.) that consume these primitives today — it's the safety net for confirming the extensions below don't change their rendered output.

## Goals / Non-Goals

**Goals:**
- Make the approved HUD mockup real, pixel-intent-faithful, backed by live simulated data.
- Extend shared primitives additively so the parked case-study consumers keep rendering identically — confirmed via the existing visual-regression suite, not just by inspection.
- One responsive component, per the visual-direction doc's standing requirement — no separate mobile component.

**Non-Goals:**
- No global dark theme, no Tailwind theme/dark-mode config change. This is one page using arbitrary-value Tailwind utilities and inline styles for its HUD-specific colors/gradients/glow, matching how the mockups themselves were built — not an attempt to theme the whole app.
- No service-layer panel, no scenario picker, no staleness styling, no site-wide nav conversion — all explicitly deferred in proposal.md.
- No changes to `simulateRadioLink`'s signature or `RadioLinkTelemetry`'s shape.

## Decisions

**Primitive extensions: additive optional props, defaults byte-identical to current behavior.** Confirmed safe via `apps/web/e2e/radio-family.visual.spec.ts` (task 4 below re-runs it). Specifically:
- `Gauge`: add `trackColor?: string` (default `"#e5e5e5"`, unchanged), `gradient?: [string, string]` (two-stop stroke gradient via a unique `useId()`-based `<linearGradient>`; when omitted, falls back to the existing flat `color` prop exactly as today), `glow?: boolean` (adds an SVG `drop-shadow` filter matching the mockup's glow when true, no-op when false/omitted), `valueColor?: string` (default `"#0a0a0a"`, the current implicit text color, made explicit so HUD callers can override it).
- `LinearMeter`: add `trackColor?: string` (default `"#e5e5e5"`, unchanged) and `square?: boolean` (default `false` -> current `rounded-full` behavior; `true` -> flat/no-radius, matching the mockup's meters). Label/value text color stays on the existing `text-muted`/`text-foreground` classes for now — overriding those needs a `className` escape hatch, added as `labelClassName?: string`/`valueClassName?: string` (each defaulting to today's literal class strings).
- `SegmentBar`: add `borderColor?: string` and `expectedBorderColor?: string` (each defaulting to today's literal `border-muted`/`border-foreground` — passed as a class string default, not a hex, to keep the "unchanged when omitted" guarantee exact) and `square?: boolean` (default `false` -> `rounded-sm`; `true` -> no radius).
- `LineTrace`: unchanged.

**New `console` family in `packages/dashboards/src/console/`:**
- `severity.ts` — the four-tier scale from `docs/CONSOLE-VISUAL-DIRECTION.md` (`--good #2bd47e`, `--ok #c6ff5e`, `--warn #ffb443`, `--bad #ff5e6c`) plus `linkQualityToSeverity(pct: number): Severity`, thresholds `good >= 85`, `ok >= 65`, `warn >= 40`, else `bad` — a v1 heuristic on `link.linkQualityPct` alone, not yet reviewed against real numbers (same posture as every other invented-baseline risk in this project). **Severity is applied per-column, not per-field** — every reading in a column (chain meters, rate bar) takes that column's single severity color, matching the mockup exactly (LOCAL entirely `--good`, REMOTE entirely `--warn`) rather than judging each field independently. Finer per-field severity is a reasonable future enhancement, not attempted here.
- `LinkPanel.tsx` — the composed instrument: hairline frame + corner brackets, topline (live dot, static link identity text, chip), the link-quality gauge, LOCAL/REMOTE columns (signal, two chain `LinearMeter`s, modulation `SegmentBar`, `LineTrace` mini history), the four-item severity legend, and a footer stats row (CPU/RAM/uptime from `local.radioHealth`). Props: `{ local: RadioLinkTelemetry; remote: RadioLinkTelemetry }` — no page background/orbs, no route logic; those live in the `apps/web` page that mounts it, so `LinkPanel` stays a reusable instrument, not a full page.
- Each column keeps a short rolling history array (last N signal values) purely client-side, to feed `LineTrace` — not part of `RadioLinkTelemetry`, which only carries the current reading.

**Top gauge shows the LOCAL side's `link.linkQualityPct`** — an arbitrary but reasonable v1 choice (the tech's own sector reading), not a combined/derived value. Worth revisiting once there's a reason to show something else (e.g. a user-selected side).

**Demo scenario, hardcoded (no picker exists yet):** LOCAL runs `simulateRadioLink` with a healthy `LinkProfile` (short-to-medium sector distance) and no fault. REMOTE runs the same engine with `cableDegradationFault` triggered far in the past with a short ramp, so it's already fully plateaued at `warn` severity before the page ever loads — chosen over `rainFadeFault` specifically because `rainFadeFault` always recovers, which would make REMOTE drift back to healthy mid-demo and contradict the mockup's steady LOCAL=good/REMOTE=degraded split.

**Live-tick: 1 Hz, 1:1 simulated-to-real time.** A `setInterval` advances `atSec` by 1 every 1000ms; both `simulateRadioLink` calls re-run on each tick (cheap, pure functions, no I/O) and `LinkPanel` re-renders with fresh readings. `seed` is a fixed string (`"console-demo"`) and `baseTimeIso` is captured once at mount — both scales are easy to change later once there's a reason to (e.g. a speed control).

**Typography and colors are page-scoped, not global.** `apps/web/index.html` gains a `<link>` for JetBrains Mono (same as the mockups); the console page's root element applies it via a Tailwind arbitrary `font-family` utility so it doesn't affect the rest of the (different-font) site. HUD colors are Tailwind arbitrary-value utilities (`bg-[#05070a]`, etc.) and inline styles for gradients/glow, matching how the mockups themselves are built — not a new Tailwind theme.

**Route: `/console`, public, own page, no `PageShell`/`BottomNav`.** `apps/web/src/pages/Console.tsx` owns the full-viewport dark background and glow orbs (translated from the mockup) and mounts `LinkPanel` inside them; wired into `App.tsx` alongside `SignIn` (outside the `RequireAuth` route group).

## Risks / Trade-offs

- **[Risk] Extending shared primitives could still visually regress the parked case-study consumers despite defaults being designed to match.** → **Mitigation**: `apps/web/e2e/radio-family.visual.spec.ts` already exists and covers exactly these components; re-running it (task 4) is the actual check, not just careful reading of the diff.
- **[Risk] The severity thresholds and the demo scenario's specific fault choice are invented, not reviewed against real link behavior.** → **Mitigation**: same posture as every other invented-baseline risk this session — flagged here, cheap to change since nothing else depends on the specific numbers yet.
- **[Risk] Per-column (not per-field) severity is a simplification that can't show "good signal, bad airtime" within one column** — the same known gap flagged back in `simulation-engine`'s own design.md as an expected near-term need. → **Mitigation**: consistent with that existing, already-acknowledged limitation; not a new problem introduced here, and not worth solving in a UI change before the underlying two-axis health model exists.
