import { describe, expect, it } from "vitest";
import { scoreFreeText } from "./score-free-text.js";

const criteria = {
  mustMention: ["seasonal", "foliage"],
  mustNotMention: ["broken"],
  bonus: ["survey"],
};

describe("scoreFreeText", () => {
  it("scores lower when a required phrase is missing", () => {
    const withBoth = scoreFreeText(criteria, "It's seasonal, caused by foliage growth.");
    const missingOne = scoreFreeText(criteria, "It's seasonal.");
    expect(missingOne.score).toBeLessThan(withBoth.score);
  });

  it("scores lower when a forbidden phrase is present", () => {
    const clean = scoreFreeText(criteria, "It's seasonal, caused by foliage growth.");
    const withForbidden = scoreFreeText(criteria, "It's seasonal, caused by foliage growth, and it's broken.");
    expect(withForbidden.score).toBeLessThan(clean.score);
  });

  it("reports which bonus phrases matched", () => {
    const result = scoreFreeText(criteria, "It's seasonal foliage — recommend a survey before spring.");
    expect(result.matchedBonusPhrases).toEqual(["survey"]);
  });
});
