import type { OptionScore } from "../schemas/rubric.js";

export type ScoreResult = {
  score: number;
  feedback: string;
};

// A missing optionId here means the client sent an id the rubric doesn't
// know about — that's a bug or an attempted bypass, not a normal "wrong
// answer" path, so this throws rather than silently scoring 0.
export function scoreOption(scores: OptionScore[], optionId: string): ScoreResult {
  const match = scores.find((s) => s.optionId === optionId);
  if (!match) {
    throw new Error(`scoreOption: no rubric score found for option id "${optionId}"`);
  }
  return { score: match.score, feedback: match.feedback };
}
