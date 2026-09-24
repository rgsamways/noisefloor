## 1. Schema: split body, add category/icon/aliases

- [x] 1.1 In `packages/kb/src/schema.ts`, replace `body: z.string()` with required `technicalExplanation: z.string()` and `laymanExplanation: z.string()`; add required `category: z.enum([...])` with the 13 kebab-case values (`rf-fundamentals`, `frequency-spectrum`, `modulation-phy-capacity`, `antennas-rf-hardware`, `radios-field-hardware`, `network-topology`, `ethernet-poe-cabling`, `ip-networking`, `nat-routing-service-layer`, `protocols-management`, `diagnostics-monitoring`, `environmental-effects`, `operations-process`); add optional `icon: z.string().optional()` and `aliases: z.array(z.string()).optional()`; verify `schema.test.ts` covers a missing-category rejection and an unrecognized-category rejection
- [x] 1.2 Update `packages/kb/src/parse.ts` and its tests for the renamed/added frontmatter fields (markdown content becomes ambiguous between two explanation fields — decide and document the frontmatter/body split, e.g. both explanations as frontmatter-adjacent sections or two content files per article; verify `parse.test.ts` round-trips a sample article with both explanations)

## 2. Build-time validation: relatedFields and icon

- [x] 2.1 Add `@noisefloor/console-schema` as a dependency of `packages/kb`; in `validate-articles.ts`, derive the full set of valid dotted `group.field` paths by walking `RadioLinkTelemetrySchema`/`ServiceLayerTelemetrySchema`'s shape once, and reject any article whose `relatedFields` entry isn't in that set, verified by a unit test with one valid path (e.g. `link.snrDb`) and one invalid path
- [x] 2.2 Add `lucide-react` as a dependency of `packages/kb`; in `validate-articles.ts`, check any `icon` value against `lucide-react`'s exported names and reject unrecognized ones, verified by a unit test with a real icon name and a fake one
- [x] 2.3 Update `schema.ts`'s `relatedFields` type/comment now that entries must resolve (no longer "free-form... never needs to resolve to anything")

## 3. Migrate the placeholder article

- [x] 3.1 Update `packages/kb/content/placeholder.md` to the new frontmatter shape (`category`, optionally `icon`/`aliases`) and split its content into `technicalExplanation`/`laymanExplanation`, verified by `pnpm --filter @noisefloor/kb build` passing

## 4. apps/web: search and category browsing on the index

- [x] 4.1 Add a small fuzzy-search dependency (e.g. `fuse.js`) to `apps/web`; in `KbIndex.tsx`, add a search input that filters the rendered list via a `useMemo`'d search instance over `articles` keyed on `title`/`summary`/`aliases`, verified by typing a query that matches only an alias and seeing the right article remain
- [x] 4.2 Add category grouping/filtering to `KbIndex.tsx` (e.g. filter chips or a dropdown for the 13 categories), verified by selecting one category and seeing only its articles

## 5. apps/web: detail page toggle, icon, real relatedFields links

- [x] 5.1 In `KbArticleDetail.tsx`, render both `technicalExplanation` and `laymanExplanation` behind a toggle/tabs defaulting to `laymanExplanation`, verified manually in the browser
- [x] 5.2 Render the article's `icon` (when present) next to the title using the matching `lucide-react` component, verified manually in the browser
- [x] 5.3 Change the `relatedFields` sidebar from plain text to real links (target TBD — e.g. deep-linking into `/console` is out of scope per design.md's Non-Goals, so link to nothing yet or render as styled read-only chips confirming the path resolved — decide the minimal version that satisfies "real link, not dead text" without building the console-side affordance)

## 6. Pilot content batch

- [x] 6.1 Author 10-15 articles spanning at least 6 of the 13 categories, each with `technicalExplanation`, `laymanExplanation`, `category`, and at least a few using `icon`/`aliases`/`relatedFields`, verified by `pnpm --filter @noisefloor/kb build` passing and manual review in the browser (search, category filter, toggle, icon, and any relatedFields links all exercised at least once across the batch)
- [x] 6.2 Present the pilot batch to Robin for review before any further glossary authoring begins (per proposal.md's sequencing)

## 7. Spec conformance

- [x] 7.1 Run `openspec validate --change kb-content-model-and-search --strict` and resolve any reported issues
- [x] 7.2 Confirm every scenario in `specs/knowledge-base/spec.md` has a corresponding passing test or manually-verified behavior from tasks 1-6
