import { z } from "zod";
import { EvidenceSchema } from "./evidence.js";
import { PromptSchema } from "./prompt.js";
import { RubricSchema } from "./rubric.js";

export const FeedbackSchema = z.object({
  text: z.string(),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

export const StageSchema = z.object({
  id: z.string(),
  title: z.string(),
  reveal: z.array(EvidenceSchema),
  prompt: PromptSchema,
  rubric: RubricSchema,
  feedback: FeedbackSchema,
});
export type Stage = z.infer<typeof StageSchema>;
