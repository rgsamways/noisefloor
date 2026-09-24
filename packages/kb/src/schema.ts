import { z } from "zod";

// The 13 groupings drafted for the fixed-wireless glossary pilot — see
// openspec/changes/kb-content-model-and-search design.md's Decision 1.
// Adding a 14th value later is a one-line, non-breaking change; not
// worth a more flexible taxonomy against a hypothetical future need.
export const KB_CATEGORIES = [
  "rf-fundamentals",
  "frequency-spectrum",
  "modulation-phy-capacity",
  "antennas-rf-hardware",
  "radios-field-hardware",
  "network-topology",
  "ethernet-poe-cabling",
  "ip-networking",
  "nat-routing-service-layer",
  "protocols-management",
  "diagnostics-monitoring",
  "environmental-effects",
  "operations-process",
] as const;
export type KbCategory = (typeof KB_CATEGORIES)[number];

// Standalone reference content — no Case or Gotcha linkage required.
// relatedFields, when present, must resolve to a real console-schema
// field path (validated at build time in validate-articles.ts against
// @noisefloor/console-schema — see design.md's Decision 2); it is not
// free-form.
export const KbArticleSchema = z.object({
  id: z.string(),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug must be URL-safe (lowercase, hyphen-separated)"),
  title: z.string(),
  summary: z.string(),
  technicalExplanation: z.string(),
  laymanExplanation: z.string(),
  category: z.enum(KB_CATEGORIES),
  // Kebab-case Lucide icon name (e.g. "radio-tower"), matching lucide.dev's
  // own icon-browser naming — converted to lucide-react's PascalCase
  // export name and validated at build time (icon-validation.ts, design.md's
  // Decision 3); not checked by this schema alone, since Zod has no way to
  // import lucide-react's runtime export set as a validator.
  icon: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  relatedFields: z.array(z.string()).optional(),
});

export type KbArticle = z.infer<typeof KbArticleSchema>;
