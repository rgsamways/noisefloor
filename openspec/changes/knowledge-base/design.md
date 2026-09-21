## Context

See `proposal.md` for motivation. This is new, additive scope: a public reference-content type that does not depend on the parked case-study schemas or on `radio-console-schema` (in progress, unimplemented) landing first. `packages/cases` is the closest existing precedent in this repo for "authored content validated against a schema at build time," and is worth mirroring for consistency, but its content (`World`/`Case`) is parked and this change does not touch it.

## Goals / Non-Goals

**Goals:**
- A content schema and package boundary for KB articles that a non-engineer reviewer (Robin, checking facts) can read and edit as plain text/markdown, not structured JSON they'd have to hand-edit carefully.
- Two public, unauthenticated routes: an index and a per-article detail view, per the spec.
- Terminology in the initial content set aligned with `radio-console-schema`'s planned field groups (link, throughput, far end, radio health, time evidence, service layer) so early articles are ready to cross-link once a console UI exists — informational alignment only, not a structural dependency (per spec, `relatedFields` doesn't need to resolve to anything).

**Non-Goals:**
- No search, filtering, or categorization UI beyond a flat index — revisit once there are enough articles for it to matter.
- No versioning or edit history beyond what git already provides.
- No console UI integration (no "what is this?" affordance wired into any dashboard component) — that's a follow-up change once both this and a console UI exist.
- No authentication, roles, or in-app authoring UI. Content is authored as files in the repo and reviewed like code (via PR/commit), matching how cases are authored today.
- No actual article content is written in this change — this defines the schema and routes only, same scoping discipline as `radio-console-schema` (schema/design reviewed before content or UI work starts).

## Decisions

**New package: `packages/kb`.** Not folded into `packages/shared` (parked case-study `World`/`Case`/`Gotcha` schemas live there — mixing in a live, unrelated content type risks the same "which schema is live" confusion `radio-console-schema` deliberately avoided by not extending `packages/shared` either). Not folded into `packages/cases` — that package name and its README are specific to the parked case-study product; naming this content `kb` (or "knowledge base") keeps it legible on its own terms, consistent with the multi-craft-expansion idea in memory to keep naming generic rather than fixed-wireless-specific.

**Content format: one markdown file per article, with a small YAML-ish frontmatter block for `id`/`slug`/`title`/`summary`/`relatedFields`, body as markdown.** Considered plain `.ts` objects (like `packages/cases`' content, which is deeply structured with stages/rubrics/evidence and benefits from TypeScript's shape-checking) but rejected for KB specifically: KB articles are prose, not structured game content, and Robin's review pass is "read this and correct any factual error" — markdown is the lower-friction format for that role. A build-time script validates frontmatter against the Zod `KbArticle` schema and fails the build on a missing field or duplicate slug (mirrors `packages/cases`' build-time validation, applied to a simpler shape).

**Routes live in `apps/web` as `/kb` and `/kb/:slug`, reading `packages/kb`'s content directly at build time (static), not through `apps/api`.** Nothing about KB content is dynamic or per-user — no auth check, no database row — so serving it as statically-generated/bundled content avoids standing up API routes and a database table for content that's really just reviewed prose shipped with the app. Revisit only if a future requirement needs runtime-editable content without a redeploy.

## Risks / Trade-offs

- **[Risk] Claude-drafted RF/networking content contains a factual error that ships before Robin's review catches it.** → **Mitigation**: this is the explicit reason the authoring workflow requires Robin's review before publish (proposal.md); no article should be treated as published until that review happens, and this change doesn't add any mechanism that could bypass it (no auto-publish, no runtime generation).
- **[Risk] Overlap with the parked `gotchas` concept could confuse future authors about which content type a given fact belongs in.** → **Mitigation**: the distinction is structural, not just documented — `Gotcha` requires a non-empty `cases` list (case-content-schema spec), `KbArticle` requires none and cannot reference a case at all in this schema. A future gotcha-resuming change would need its own explicit decision to cross-link the two; nothing here does it implicitly.
- **[Risk] Static/build-time content means updating an article requires a redeploy, not a content-team edit-and-publish flow.** → **Mitigation**: acceptable at this content volume and authorship model (Claude drafts, Robin reviews via normal repo review); revisit if KB grows enough to need a real CMS-like flow.
