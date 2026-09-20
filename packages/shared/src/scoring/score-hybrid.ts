import type { FreeTextRubric, OptionScore } from "../schemas/rubric.js";
import { scoreFreeText, type FreeTextScoreResult } from "./score-free-text.js";
import { scoreOption, type ScoreResult } from "./score-option.js";

export type HybridAnswer = { optionId: string } | { text: string };

// A hypothesis-kind prompt's allowFreeText: true means either form can
// arrive here — dispatch to whichever scoring the answer's shape calls for.
export function scoreHybrid(
  rubric: { scores: OptionScore[]; criteria: FreeTextRubric },
  answer: HybridAnswer,
): ScoreResult | FreeTextScoreResult {
  if ("optionId" in answer) {
    return scoreOption(rubric.scores, answer.optionId);
  }
  return scoreFreeText(rubric.criteria, answer.text);
}
