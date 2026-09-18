## Why

`apps/web` currently has no public-facing page — `/` is gated behind `RequireAuth` and shows a bare "signed in as" placeholder from Phase 0's auth verification. `NOISEFLOOR-OUTLINE.md` §8 calls for a public landing page ("what this is, one demo stage playable without login"), and a visual design for it now exists (`homepage/DESIGN-NOTES.md` plus two static HTML mockups) that should be implemented as real React/Tailwind UI, not copied HTML.

## What Changes

- Add a public `Landing` page at `/`: top strip (wordmark + sign-in link), hero (headline/sub/CTA), and a three-column "Play / Build / Prove" section, per `homepage/DESIGN-NOTES.md`.
- Add `BottomNav` ("the floor"): a persistent, fixed bottom navigation bar (Home/Cases/Gotchas/Me) shared across pages, with the laptop/phone layout variants and active-item treatment described in the design notes.
- Re-theme `apps/web` to the monochrome palette and typefaces in the design notes (ink/paper/body-grey/caption-grey, IBM Plex Sans/Mono), replacing Phase 0's placeholder dark theme.
- Move the existing authenticated placeholder page from `/` to `/me` (still behind `RequireAuth`), since `/` is now the public landing route.
- **Exception to `PROJECT-PLAN.md` decision D14, logged explicitly**: add a `LinkCapacityChart` **stub** to `packages/dashboards/src/crm/` so the landing page has a real component to render, not a picture — matching the design notes' insistence that the hero chart be "the real component, not a picture." D14 said dashboard work in `packages/dashboards` waits for the `world-validator` change to land first; this stub is a deliberate, narrow exception: it renders fixed demo numbers (not a `World`), carries no dependency on the validator, and is explicitly documented in its own file as a placeholder Phase 1 replaces wholesale — not a first draft of the real component family.

## Capabilities

### New Capabilities
- `landing-page`: the public `/` route — hero, three-column value props, and the bottom navigation chrome shared across the site.

### Modified Capabilities
_(none — no existing spec covers page routing or site chrome; the auth flow's own behavior per `specs/magic-link-auth/spec.md` is unchanged, only where its sign-in link is surfaced from)_

## Impact

- **Affected code**: `apps/web` (new `Landing` page, `BottomNav` component, theme/CSS, route table, `Hello` page relocated to `/me`), `packages/dashboards` (new `crm/LinkCapacityChart` stub, explicitly temporary).
- **No backend/API changes.**
- **No change to Phase 0's auth behavior** — only where the sign-in link appears (moved from a bare placeholder into the new top strip).
