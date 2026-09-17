import { z } from "zod";

// For option-based prompts (hypothesis/nextCheck/action): each option an
// author defined on the Prompt gets a score (0..3) and feedback here,
// looked up by option id at commit time.
export const OptionScoreSchema = z.object({
  optionId: z.string(),
  score: z.number().min(0).max(3),
  feedback: z.string(),
});
export type OptionScore = z.infer<typeof OptionScoreSchema>;

// For free-text prompts (whatChanged/customerMessage/ticketNote, and
// hypothesis when answered as free text): v1 scores by keyword/phrase
// rubric. Criteria are written as sentences (not just bare keywords) so an
// LLM grader can be swapped in later without changing this shape
// (NOISEFLOOR-OUTLINE.md §5.5).
export const FreeTextRubricSchema = z.object({
  mustMention: z.array(z.string()).default([]),
  mustNotMention: z.array(z.string()).default([]),
  bonus: z.array(z.string()).default([]),
});
export type FreeTextRubric = z.infer<typeof FreeTextRubricSchema>;

export const RubricSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("options"),
    scores: z.array(OptionScoreSchema),
  }),
  z.object({
    kind: z.literal("freeText"),
    criteria: FreeTextRubricSchema,
  }),
]);
export type Rubric = z.infer<typeof RubricSchema>;
