// Deliberately does NOT re-export ./parse.js: parseArticleMarkdown/
// validateArticleSet pull in gray-matter (a Node-only, build-time-only
// frontmatter parser) — consumers like apps/web only need the schema/type
// and the already-parsed articles array, and re-exporting parse.js here
// once leaked gray-matter into the browser bundle (caught by actually
// running a production build, not by typecheck). Tests and
// validate-articles.ts import ./parse.js directly instead.
export * from "./schema.js";
export { articles } from "./generated-articles.js";
