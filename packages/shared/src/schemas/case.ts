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

export const CaseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
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
});
export type Case = z.infer<typeof CaseSchema>;
