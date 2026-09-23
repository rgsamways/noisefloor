import matter from "gray-matter";
import { KbArticleSchema, type KbArticle } from "./schema.js";

// One markdown file per article: a small YAML frontmatter block
// (id/slug/title/summary/relatedFields) plus a markdown body — see
// openspec/changes/knowledge-base design.md's rationale (lower-friction
// for Robin's "read this and correct any factual error" review role than
// hand-editing structured JSON/TS objects).
export function parseArticleMarkdown(raw: string): KbArticle {
  const { data, content } = matter(raw);
  return KbArticleSchema.parse({ ...data, body: content.trim() });
}

// Fails loudly on the first duplicate slug across the full loaded content
// set — a duplicate would make /kb/:slug ambiguous.
export function validateArticleSet(articles: readonly KbArticle[]): void {
  const seen = new Set<string>();
  for (const article of articles) {
    if (seen.has(article.slug)) {
      throw new Error(`Duplicate KB article slug: "${article.slug}"`);
    }
    seen.add(article.slug);
  }
}
