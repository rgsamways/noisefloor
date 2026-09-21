## 1. Package scaffold

- [ ] 1.1 Create `packages/kb` (package.json, tsconfig extending the repo base) and verify it builds as an empty package in the pnpm workspace
- [ ] 1.2 Define the `KbArticle` Zod schema (`id`, `slug`, `title`, `summary`, `body`, optional `relatedFields`) per `specs/knowledge-base/spec.md` and verify a unit test accepts a well-formed article and rejects one missing a required field

## 2. Content loading and validation

- [ ] 2.1 Implement a frontmatter parser that reads one markdown file per article (frontmatter: `id`/`slug`/`title`/`summary`/`relatedFields`; body: markdown) into a `KbArticle[]`, and verify a unit test round-trips a sample file
- [ ] 2.2 Add a build-time validation step that runs every loaded article through the `KbArticle` schema and fails the build on a schema violation, and verify a test build fails when a required field is removed from a sample article
- [ ] 2.3 Add a duplicate-slug check across the full loaded content set and verify a test fails when two sample articles share a slug

## 3. Public routes

- [ ] 3.1 Add a `/kb` route in `apps/web` rendering the index (slug, title, summary per article) and verify it renders with zero, one, and multiple articles in the content set
- [ ] 3.2 Add a `/kb/:slug` route rendering full article content, and verify an unknown slug renders a not-found view rather than throwing
- [ ] 3.3 Verify both routes render without requiring sign-in (no auth guard applied), per spec

## 4. Navigation

- [ ] 4.1 Add a `Console`-adjacent `KB` entry to `apps/web/src/components/BottomNav.tsx`'s `NAV_ITEMS` pointing at `/kb`, and verify it renders active on `/kb` and `/kb/:slug`

## 5. Verification

- [ ] 5.1 Run the full `packages/kb` unit test suite and confirm it passes
- [ ] 5.2 Manually load `/kb` and a `/kb/:slug` for a placeholder test article in a dev server and confirm both render correctly with no console content authored yet (this change ships the schema and routes only — see design.md Non-Goals)
