## Context

`apps/web` exists (Phase 0) with a magic-link sign-in flow and a bare authenticated placeholder at `/`. A visual design for the public landing page exists as two static HTML mockups (`homepage/homepage-laptop.html`, `homepage/homepage-phone.html`) plus `homepage/DESIGN-NOTES.md` explaining the intent — these came from a design pass done outside this session and are reference-only, not to be copied in as markup. See `proposal.md` for why this change exists and its D14 exception.

## Goals / Non-Goals

**Goals:**
- Implement the landing route as real React + Tailwind v4 + `lucide-react`, matching the mockups' look without copying their inline-styled HTML.
- Make `BottomNav` genuinely reusable site chrome, not landing-page-specific markup.
- Keep the stub `LinkCapacityChart` honestly temporary: obviously fake data, clearly commented, isolated enough that Phase 1 can replace its internals without the landing page needing to change.

**Non-Goals:**
- No `/cases` or `/gotchas` page content — the nav links to those routes, but no page exists yet at them (out of scope for this change; they're future phases per `NOISEFLOOR-OUTLINE.md` §8).
- No real `World`/`Case`-driven rendering in the stub chart — that's Phase 1, after `world-validator` lands per D14.
- No dark mode — `DESIGN-NOTES.md` explicitly defers it.

## Decisions

**Stub chart lives at `packages/dashboards/src/crm/LinkCapacityChart.tsx`, not inside `apps/web`.** Alternative considered: keep the fake chart entirely inside `apps/web` to avoid touching `packages/dashboards` at all before the world-validator change. Rejected: `NOISEFLOOR-OUTLINE.md` §4's whole architecture is "dashboards are components, cases are data" — the component belongs in `packages/dashboards` regardless of what feeds it, and Phase 1 will want to evolve this exact file in place rather than move code from `apps/web` into `packages/dashboards` later. The stub is scoped narrowly (fixed demo numbers, no `World` dependency, no other `crm/*` components added) so it doesn't expand into the dashboard-family work D14 deferred.

**Theme tokens re-defined, not layered on top of Phase 0's placeholder theme.** `apps/web/src/index.css`'s CSS custom properties (`--background`, `--foreground`, `--muted`, `--border`) get reassigned to the monochrome palette (paper/ink/caption-grey/ink) rather than adding a second parallel set of tokens — existing components (`SignIn`, the auth placeholder) already consume these tokens via Tailwind's `bg-background`/`text-foreground`/etc. classes, so they re-skin automatically. Only the primary button's `bg-accent`/`text-accent-foreground` classes (Phase 0's one hardcoded accent-colored element) need a direct edit, since the accent token is removed entirely — the design calls for an ink-filled button, not a separate accent color.

**`BottomNav` merges laptop/phone markup with responsive classes, one component.** Alternative considered: two separate components switched by a `useMediaQuery` hook. Rejected: the two mockups share the same structural content (same four items, same icons); only spacing, the two side captions, and the grid-vs-flex layout differ, all expressible as Tailwind breakpoint classes without JS-driven layout branching.

**`/me` receives the relocated Phase 0 placeholder.** `NOISEFLOOR-OUTLINE.md` §8's route table already reserves `/me` for "progress, attempts, scores" — moving the existing authenticated placeholder there now, rather than inventing a different temporary path, means no second relocation is needed once `/me` gets real content later.

## Risks / Trade-offs

- **[Risk] The stub chart gets mistaken for real Phase 1 work and never gets replaced.** → **Mitigation**: an explicit code comment in the file itself states it's a stub pending the `world-validator` change and Phase 1, per `PROJECT-PLAN.md` D14, plus this change's own proposal names the exception explicitly rather than leaving it implicit.
- **[Risk] Nav links to unbuilt `/cases`/`/gotchas` routes render a blank page with no explanation.** → **Mitigation**: accepted for this change — `NOISEFLOOR-OUTLINE.md`'s own phasing doesn't build those pages yet either, and a blank result is an honest reflection of "not built," not a broken link (no 404, no crash). Revisit if it proves confusing before those phases land.
