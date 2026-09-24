## Why

Robin wants to grow the KB from one placeholder article into a real fixed-wireless glossary (250+ terms drafted so far as a candidate list, likely more once scoped) with dual-level explanations, icons, and easy discovery. Today's `KbArticle` (`id`/`slug`/`title`/`summary`/`body`/`relatedFields`) and its flat, ungrouped, unsearchable index can't carry that: one `body` field can't hold both a technical and a layman explanation, there's no category or icon, and `relatedFields` is decorative text that never has to resolve to anything. The content-model and UI gaps need to close *before* authoring hundreds of articles, not after — reworking the format across hundreds of already-written articles is much more expensive than reworking it across zero.

## What Changes

- **BREAKING**: `KbArticle.body` is replaced by two required fields, `technicalExplanation` and `laymanExplanation` — every article teaches the concept at both levels. The one existing placeholder article is migrated, not left on the old field.
- Add an optional `icon` field: a Lucide icon name, validated at build time against `lucide-react`'s actual export set (fails loudly on a typo, matching the KB's existing build-time-validation philosophy for schema/slug-uniqueness).
- Add a required `category` field, a fixed enum of the groupings already drafted in conversation (RF fundamentals, frequency & spectrum, modulation/PHY & capacity, antennas & RF hardware, radios/mounts & field hardware, network topology & architecture, ethernet/PoE & cabling, IP networking & addressing, NAT/routing & service layer, protocols & management, diagnostics/monitoring & metrics, environmental & propagation effects, operations/install & process). This deliberately reverses the original `knowledge-base` change's Non-Goal ("no categorization UI until there's enough real content to need it") — that threshold is being crossed on purpose now, not drifted into.
- Add an optional `aliases` string array for acronym/synonym search coverage (e.g. "SNR" ↔ "Signal-to-Noise Ratio").
- **BREAKING**: `relatedFields` becomes a validated list of real console-schema field paths (dotted `group.field` form, e.g. `link.snrDb`, `throughput.airtimePct`) checked at build time against `@noisefloor/console-schema`'s actual field set, instead of free-form strings that never have to resolve to anything. This is what makes the "hook for other features" usable — a future console UI can now reliably resolve "this live reading → this article," not just display a label.
- Add client-side fuzzy search (title/summary/aliases/category) over the KB index — no new backend or build-time index file needed, since `articles` is already a fully-loaded array bundled into the client (`packages/kb/src/generated-articles.js` → `apps/web`).
- Update `KbIndex.tsx` (search box, category grouping/filtering) and `KbArticleDetail.tsx` (both explanation levels with a technical/layman toggle, the icon, `relatedFields` rendered as real links) to match.
- Author a pilot batch of ~10-15 articles in the new format, spanning multiple categories, to validate the format end-to-end before the much larger glossary-authoring effort (a separate follow-up change, not part of this one).

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `knowledge-base`: `KbArticle`'s structure changes (`body` → `technicalExplanation`/`laymanExplanation`, new `icon`/`category`/`aliases` fields, `relatedFields` becomes validated); the KB index and article-detail requirements gain category/search and real relatedFields links.

## Impact

- **Affected code**: `packages/kb` (`schema.ts`, `parse.ts`, generated-articles pipeline, all tests), `apps/web/src/pages/KbIndex.tsx` and `KbArticleDetail.tsx`, the one existing placeholder article (`packages/kb/content/placeholder.md`, migrated to the new field names).
- **New dependency**: a small client-side fuzzy-search library (e.g. Fuse.js) in `apps/web`. No new dependency for icons — `lucide-react` is already used elsewhere in `apps/web`.
- **Review-load note**: this change doesn't itself add glossary content beyond the pilot batch, but it sets the format hundreds of future articles will follow. Robin's existing review role (Claude drafts for factual accuracy, Robin reviews) scales with article count once the full glossary is authored in a follow-up change — worth deciding then whether every article gets full review or a lighter per-category spot-check.
- **Not affected**: `packages/cases`, the parked case-study schemas, `openspec/specs/case-content-schema`.
