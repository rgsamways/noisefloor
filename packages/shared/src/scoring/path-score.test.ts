import { describe, expect, it } from "vitest";
import { calculatePathScore, type HypothesisCommitRecord } from "./path-score.js";

describe("calculatePathScore", () => {
  it("sums stage scores with no bonus when hypotheses are unrevised", () => {
    const unrevised: HypothesisCommitRecord[] = [
      { kind: "option", optionId: "a" },
      { kind: "option", optionId: "a" },
    ];
    expect(calculatePathScore([2, 2], unrevised)).toBe(4);
  });

  it("adds a revision bonus when a later option differs from an earlier one", () => {
    const revised: HypothesisCommitRecord[] = [
      { kind: "option", optionId: "a" },
      { kind: "option", optionId: "b" },
    ];
    expect(calculatePathScore([2, 2], revised)).toBe(5);
  });

  it("scores a revised path higher than an unrevised path at equal per-stage scores", () => {
    const unrevised: HypothesisCommitRecord[] = [
      { kind: "freeText", matchedBonusPhrases: [] },
      { kind: "freeText", matchedBonusPhrases: [] },
    ];
    const revised: HypothesisCommitRecord[] = [
      { kind: "freeText", matchedBonusPhrases: [] },
      { kind: "freeText", matchedBonusPhrases: ["foliage"] },
    ];
    expect(calculatePathScore([2, 2], revised)).toBeGreaterThan(calculatePathScore([2, 2], unrevised));
  });

  it("treats switching from an option to free text as a revision", () => {
    const mixed: HypothesisCommitRecord[] = [
      { kind: "option", optionId: "a" },
      { kind: "freeText", matchedBonusPhrases: [] },
    ];
    expect(calculatePathScore([1, 1], mixed)).toBe(3);
  });
});
