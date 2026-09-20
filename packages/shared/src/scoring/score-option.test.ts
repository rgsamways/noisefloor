import { describe, expect, it } from "vitest";
import { scoreOption } from "./score-option.js";

describe("scoreOption", () => {
  it("returns the matched option's authored score and feedback", () => {
    const scores = [{ optionId: "a", score: 2, feedback: "Reasonable, but not the whole picture yet." }];
    expect(scoreOption(scores, "a")).toEqual({ score: 2, feedback: "Reasonable, but not the whole picture yet." });
  });

  it("throws for an unknown option id", () => {
    const scores = [{ optionId: "a", score: 2, feedback: "x" }];
    expect(() => scoreOption(scores, "z")).toThrow();
  });
});
