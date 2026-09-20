import { describe, expect, it } from "vitest";
import { scoreHybrid } from "./score-hybrid.js";

const rubric = {
  scores: [{ optionId: "a", score: 1, feedback: "Plausible but incomplete." }],
  criteria: { mustMention: ["foliage"], mustNotMention: [], bonus: [] },
};

describe("scoreHybrid", () => {
  it("scores an option answer via the option scores", () => {
    expect(scoreHybrid(rubric, { optionId: "a" })).toEqual({ score: 1, feedback: "Plausible but incomplete." });
  });

  it("scores a free-text answer via the free-text criteria", () => {
    const result = scoreHybrid(rubric, { text: "It's foliage growth." });
    expect(result.score).toBeGreaterThan(0);
  });
});
