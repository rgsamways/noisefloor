import matter from "gray-matter";
import { KbArticleSchema, type KbArticle } from "./schema.js";

// One markdown file per article: a small YAML frontmatter block
// (id/slug/title/summary/category/icon/aliases/relatedFields) plus a
// markdown body split into two `## Technical` / `## Layman` sections —
// see openspec/changes/kb-content-model-and-search design.md's rationale
// (lower-friction for Robin's "read this and correct any factual error"
// review role than hand-editing structured JSON/TS objects, and keeps
// "one file per article" rather than splitting each article across two
// files).
const SECTION_HEADING = /^##\s*(technical|layman)\s*$/gim;

export function splitExplanations(content: string): { technicalExplanation: string; laymanExplanation: string } {
  const matches = [...content.matchAll(SECTION_HEADING)];
  if (matches.length !== 2) {
    throw new Error('KB article body must contain exactly one "## Technical" and one "## Layman" heading');
  }

  const sections: Record<string, string> = {};
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]!;
    const label = match[1]!.toLowerCase();
    const start = match.index! + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1]!.index! : content.length;
    sections[label] = content.slice(start, end).trim();
  }

  if (!sections.technical || !sections.layman) {
    throw new Error('KB article body must contain exactly one "## Technical" and one "## Layman" heading');
  }

  return { technicalExplanation: sections.technical, laymanExplanation: sections.layman };
}

export function parseArticleMarkdown(raw: string): KbArticle {
  const { data, content } = matter(raw);
  const { technicalExplanation, laymanExplanation } = splitExplanations(content.trim());
  return KbArticleSchema.parse({ ...data, technicalExplanation, laymanExplanation });
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
