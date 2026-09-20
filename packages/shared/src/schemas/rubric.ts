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
  // For hypothesis-kind prompts, which always allow free text alongside
  // their options (Prompt's allowFreeText: true) — a trainee can answer
  // either way, so scoring needs both an option lookup and a free-text
  // rubric on the same stage, not a forced choice of one rubric shape.
  z.object({
    kind: z.literal("hybrid"),
    scores: z.array(OptionScoreSchema),
    criteria: FreeTextRubricSchema,
  }),
  // Pairs with Prompt's findTheFault kind — grading is "did they name (some
  // of) these specific tensions", referencing the world-consistency
  // validator's own rule ids (see validator/types.ts) rather than
  // duplicating criteria text for something the validator already knows
  // how to detect.
  z.object({
    kind: z.literal("findTheFault"),
    tensionRuleIds: z.array(z.string()).min(1),
  }),
]);
export type Rubric = z.infer<typeof RubricSchema>;
