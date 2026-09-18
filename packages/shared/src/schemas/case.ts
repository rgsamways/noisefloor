import { z } from "zod";
import { EvidenceSchema } from "./evidence.js";
import { RubricSchema } from "./rubric.js";
import { StageSchema } from "./stage.js";
import { WorldSchema } from "./world.js";

export const OpeningSchema = z.object({
  ticketText: z.string(),
  evidence: z.array(EvidenceSchema).default([]),
});
export type Opening = z.infer<typeof OpeningSchema>;

// Optional deeper dives for Tier 1s curious about Tier 2 material, unlocked
// after the debrief (NOISEFLOOR-OUTLINE.md §5.1, §9). Lighter-weight than a
// Stage — a branch poses one question and one rubric, no multi-stage reveal.
export const BranchSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  rubric: RubricSchema,
});
export type Branch = z.infer<typeof BranchSchema>;

export const DebriefSchema = z.object({
  narrative: z.string(),
  annotatedReplays: z.array(EvidenceSchema).default([]),
  gotchaIds: z.array(z.string()).default([]),
});
export type Debrief = z.infer<typeof DebriefSchema>;

// Who wrote this case, and whether it came from a person. NOISEFLOOR-AUTHORING-PLAN.md
// §5's ladder gates authoring capability, but that ladder doesn't exist yet — this
// field just makes the distinction representable now so it doesn't need retrofitting.
export const CaseAuthorSchema = z.object({
  kind: z.enum(["curated", "user"]),
  userId: z.string().optional(),
});
export type CaseAuthor = z.infer<typeof CaseAuthorSchema>;

// Publishing tier per NOISEFLOOR-AUTHORING-PLAN.md §5. "public" is the default
// because v1 has no authoring UI yet — every case that exists is Operator-curated
// and public from the start, same as the outline already assumes.
export const CaseVisibilitySchema = z.enum(["private", "team", "public-queue", "public", "retired"]);
export type CaseVisibility = z.infer<typeof CaseVisibilitySchema>;

export const CaseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  // Content version for this case id. Bumped when a challenge is upheld and
  // produces a revised case (NOISEFLOOR-AUTHORING-PLAN.md §5-§6) — attempts
  // record which version they were played against, and scores are never
  // rewritten retroactively when a later version changes the case.
  version: z.number().int().positive(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  estimatedMinutes: z.number().positive(),
  tags: z.array(z.string()),
  gotchas: z.array(z.string()),
  world: WorldSchema,
  opening: OpeningSchema,
  stages: z.array(StageSchema).min(1),
  debrief: DebriefSchema,
  optionalBranches: z.array(BranchSchema).optional(),
  author: CaseAuthorSchema.default({ kind: "curated" }),
  visibility: CaseVisibilitySchema.default("public"),
});
export type Case = z.infer<typeof CaseSchema>;
