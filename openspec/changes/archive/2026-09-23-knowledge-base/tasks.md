## 1. Package scaffold

- [x] 1.1 Create `packages/kb` (package.json, tsconfig extending the repo base) and verify it builds as an empty package in the pnpm workspace
- [x] 1.2 Define the `KbArticle` Zod schema (`id`, `slug`, `title`, `summary`, `body`, optional `relatedFields`) per `specs/knowledge-base/spec.md` and verify a unit test accepts a well-formed article and rejects one missing a required field

## 2. Content loading and validation

- [x] 2.1 Implement a frontmatter parser that reads one markdown file per article (frontmatter: `id`/`slug`/`title`/`summary`/`relatedFields`; body: markdown) into a `KbArticle[]`, and verify a unit test round-trips a sample file
- [x] 2.2 Add a build-time validation step that runs every loaded article through the `KbArticle` schema and fails the build on a schema violation, and verify a test build fails when a required field is removed from a sample article
- [x] 2.3 Add a duplicate-slug check across the full loaded content set and verify a test fails when two sample articles share a slug

## 3. Shared HUD page shell

- [x] 3.1 Extract `HudPageShell` (`apps/web/src/components/`) from `apps/web/src/pages/Console.tsx`'s inline background/orbs/font/max-width wrapper, taking `children`
- [x] 3.2 Retrofit `Console.tsx` to use `HudPageShell`, and re-verify `/console` visually (desktop + mobile) to confirm no behavior change

## 4. Public routes

- [x] 4.1 Add a `/kb` route in `apps/web`, built on `HudPageShell`, rendering a flat card index per `docs/mockups/noisefloor-mock-kb-index.html` (grouping deferred — no `category` field exists on `KbArticle`, and design.md's Non-Goals rule out categorization UI until there's real content to need it), with `<HudFloorNav />` rendered; verify it renders with zero, one, and multiple articles in the content set
- [x] 4.2 Add a `/kb/:slug` route, built on `HudPageShell`, rendering full article content and a related-fields sidebar per `docs/mockups/noisefloor-mock-kb-detail.html`, with `<HudFloorNav />` rendered; verify an unknown slug renders a not-found view rather than throwing
- [x] 4.3 Verify both routes render without requiring sign-in (no auth guard applied), per spec
- [x] 4.4 Confirm neither route uses the severity color scale (good/ok/warn/bad) anywhere — see design.md

## 5. Navigation

- [x] 5.1 Confirm `HudFloorNav`'s existing KB item (previously 404ing) now resolves to `/kb` and shows KB as current on both `/kb` and `/kb/:slug`

## 6. Verification

- [x] 6.1 Run the full `packages/kb` unit test suite and confirm it passes
- [x] 6.2 Manually load `/kb` and a `/kb/:slug` for a placeholder test article in a dev server at both desktop and mobile viewport widths, confirm both render correctly matching the mockups, with no real article content authored yet (this change ships the schema and routes only — see design.md Non-Goals)
