// One record per hypothesis-kind commit in an attempt, in the order they
// were committed — enough information to tell whether a later one revised
// an earlier one, without needing the full answer/rubric again.
export type HypothesisCommitRecord =
  | { kind: "option"; optionId: string }
  | { kind: "freeText"; matchedBonusPhrases: string[] };

const REVISION_BONUS = 1;

function isRevision(earlier: HypothesisCommitRecord, later: HypothesisCommitRecord): boolean {
  if (earlier.kind === "option" && later.kind === "option") {
    return earlier.optionId !== later.optionId;
  }
  if (earlier.kind === "freeText" && later.kind === "freeText") {
    const earlierPhrases = new Set(earlier.matchedBonusPhrases);
    return later.matchedBonusPhrases.some((phrase) => !earlierPhrases.has(phrase));
  }
  // Switched forms (chose an option, then typed free text, or vice versa)
  // — treat that as a revision too, since it's certainly not "the same
  // guess restated."
  return true;
}

// Sum of per-stage scores, plus a flat bonus if any later hypothesis-kind
// commit represents a meaningfully different theory than an earlier one in
// the same attempt (NOISEFLOOR-OUTLINE.md §5.5, outline principle 3). A
// simple heuristic, not semantic analysis — see design.md.
export function calculatePathScore(stageScores: number[], hypothesisCommits: HypothesisCommitRecord[]): number {
  const base = stageScores.reduce((sum, score) => sum + score, 0);

  if (hypothesisCommits.length < 2) return base;

  const revised = hypothesisCommits.slice(1).some((later, i) => isRevision(hypothesisCommits[i]!, later));

  return base + (revised ? REVISION_BONUS : 0);
}
