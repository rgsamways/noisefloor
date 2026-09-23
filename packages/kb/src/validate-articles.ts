// Build-time validation step (package.json's "build" script runs this
// after tsc): re-validates the generated articles against the canonical
// KbArticleSchema and duplicate-slug check, failing the build on either.
// Belt-and-suspenders against scripts/generate-articles.mjs's duplicated
// schema drifting out of sync with src/schema.ts.
import { KbArticleSchema } from "./schema.js";
import { validateArticleSet } from "./parse.js";
import { articles } from "./generated-articles.js";

for (const article of articles) {
  const result = KbArticleSchema.safeParse(article);
  if (!result.success) {
    console.error(`KB content build failed: invalid article "${article.id}"\n${result.error.message}`);
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
