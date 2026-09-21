## Why

The console's whole thesis is "learn to read the instruments, not memorize the answers" (README.md), but a visitor staring at a reading like "airtime 82%, SNR 14 dB" has nowhere on the site to look up what those terms mean. `docs/NOISEFLOOR-CONSOLE-HANDOFF.md` §4 defines 21 normalized radio-link fields plus a service-layer panel (§5) precisely so the console can show them consistently — the same normalization makes a companion glossary tractable for the first time: one article per field/concept, not one per vendor's inconsistent naming.

This isn't a new idea — a standalone, public, Claude-drafted knowledge base was decided on 2026-09-16, before the case-study-to-console pivot. It was parked with the rest of the case-study product on 2026-09-21, but on review it doesn't depend on that product at all: unlike gotchas (case-linked traps — "traps that link back to the cases that seeded them," `case-content-schema` spec), the KB was always meant as standalone reference content, readable independently of any case. It survives the pivot cleanly and is now slated as the site's third nav item alongside Home and Console.

## What Changes

- Add a `knowledge-base` capability: a content schema for standalone reference articles (definitions/concepts) and the public routes that present them.
- Articles are **not** case-linked or console-schema-linked by requirement — a `KbArticle` stands alone (unlike `Gotcha`, which requires a non-empty `cases` list). An article MAY reference a console schema field for cross-linking (e.g. from a future console UI's "what is this?" affordance), but that reference is optional, not structural.
- Initial content scope: definitions for the radio-link field groups named in the in-progress `radio-console-schema` change (link, throughput, far end, radio health, time evidence) and the service-layer panel (DHCP lease, addressing, NAT) — RF/networking fundamentals a fixed-wireless tech needs to read the console, not vendor-specific how-tos.
- Public, no-login routes: an index (`/kb`) and per-article detail (`/kb/:slug`), discoverable from the landing page nav.
- Authoring workflow (process, not a schema requirement): Claude drafts articles from general domain knowledge; Robin reviews and corrects for factual accuracy before publish. This is the opposite direction from cases/gotchas, which are authored from Robin's own real fixed-wireless support experience.
- No simulation engine, no console UI, and no change to the parked case-study schemas (`packages/shared/src/schemas`, `openspec/specs/case-content-schema`) — this content type is additive and independent.

## Capabilities

### New Capabilities
- `knowledge-base`: the content schema for standalone reference articles (definitions/concepts) and the public route contract (`/kb` index, `/kb/:slug` detail) that presents them.

### Modified Capabilities
(none — this is new, standalone scope; it does not touch `case-content-schema` or the in-progress `radio-console-schema`)

## Impact

- **Affected code**: a new content package/location for KB articles (exact boundary — new `packages/kb` vs. folding into `packages/shared` — is a design.md decision); new routes and a third nav item in `apps/web`.
- **Not affected**: `packages/shared/src/schemas` (parked case-study `World`/`Case`/`Gotcha` types untouched), `packages/cases`, `openspec/changes/radio-console-schema` (referenced for terminology only, not depended on structurally — this change does not block on that one landing first).
- **Unlocks**: a future console UI can optionally deep-link a reading to its KB article; the KB can grow independently of whether cases ever resume.
