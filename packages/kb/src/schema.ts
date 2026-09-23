import { z } from "zod";

// Standalone reference content — no case or console-schema linkage
// required, unlike Gotcha (which requires a non-empty `cases` list).
// relatedFields is a free-form cross-linking hint that never needs to
// resolve to anything real.
export const KbArticleSchema = z.object({
  id: z.string(),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug must be URL-safe (lowercase, hyphen-separated)"),
  title: z.string(),
  summary: z.string(),
  body: z.string(),
  relatedFields: z.array(z.string()).optional(),
});

export type KbArticle = z.infer<typeof KbArticleSchema>;
