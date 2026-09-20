import type { FreeTextRubric } from "../schemas/rubric.js";

export type FreeTextScoreResult = {
  score: number;
  feedback: string;
  matchedBonusPhrases: string[];
};

const REQUIRED_CONTENT_POINTS = 2;
const MAX_SCORE = 3;

function includesPhrase(haystack: string, phrase: string): boolean {
  return haystack.includes(phrase.toLowerCase());
}

// v1 keyword/phrase scoring (NOISEFLOOR-OUTLINE.md §5.5) — criteria are
// sentences, not bare keywords, so a future LLM grader can read the same
// rubric shape without a migration.
export function scoreFreeText(criteria: FreeTextRubric, text: string): FreeTextScoreResult {
  const normalized = text.toLowerCase();

  const mustMentionHits = criteria.mustMention.filter((phrase) => includesPhrase(normalized, phrase));
  const mustNotMentionHits = criteria.mustNotMention.filter((phrase) => includesPhrase(normalized, phrase));
  const bonusHits = criteria.bonus.filter((phrase) => includesPhrase(normalized, phrase));

  const requiredRatio = criteria.mustMention.length === 0 ? 1 : mustMentionHits.length / criteria.mustMention.length;

  let score = requiredRatio * REQUIRED_CONTENT_POINTS;
  score -= mustNotMentionHits.length;
  if (bonusHits.length > 0) score += 1;
  score = Math.max(0, Math.min(MAX_SCORE, score));

  const missing = criteria.mustMention.filter((phrase) => !mustMentionHits.includes(phrase));
  let feedback: string;
  if (missing.length > 0) {
    feedback = `Missing: ${missing.join(", ")}.`;
  } else if (mustNotMentionHits.length > 0) {
    feedback = `Contains phrases to avoid: ${mustNotMentionHits.join(", ")}.`;
  } else {
    feedback = "Covers the key points.";
  }

  return { score, feedback, matchedBonusPhrases: bonusHits };
}
