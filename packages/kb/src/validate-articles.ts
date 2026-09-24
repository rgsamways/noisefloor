// Build-time validation step (package.json's "build" script runs this
// after tsc): re-validates the generated articles against the canonical
// KbArticleSchema and duplicate-slug check, failing the build on either.
// Belt-and-suspenders against scripts/generate-articles.mjs's duplicated
// schema drifting out of sync with src/schema.ts. Also validates
// relatedFields against real console-schema field paths and icon against
// lucide-react's real export set (design.md's Decisions 2 and 3) — these
// checks need the compiled dist/ output (they import lucide-react and
// @noisefloor/console-schema), so they can't run inside
// scripts/generate-articles.mjs, which runs before tsc.
import { KbArticleSchema } from "./schema.js";
import { validateArticleSet } from "./parse.js";
import { isValidRelatedField } from "./related-fields.js";
import { isValidLucideIcon } from "./icon-validation.js";
import { articles } from "./generated-articles.js";

for (const article of articles) {
  const result = KbArticleSchema.safeParse(article);
  if (!result.success) {
    console.error(`KB content build failed: invalid article "${article.id}"\n${result.error.message}`);
    process.exit(1);
  }

  for (const field of article.relatedFields ?? []) {
    if (!isValidRelatedField(field)) {
      console.error(`KB content build failed: article "${article.id}" has an unresolvable relatedFields entry "${field}"`);
      process.exit(1);
    }
  }

  if (article.icon && !isValidLucideIcon(article.icon)) {
    console.error(`KB content build failed: article "${article.id}" has an unrecognized icon "${article.icon}"`);
    process.exit(1);
  }
}

try {
  validateArticleSet(articles);
} catch (error) {
  console.error(`KB content build failed: ${(error as Error).message}`);
  process.exit(1);
}

console.log(`Validated ${articles.length} KB article(s).`);
