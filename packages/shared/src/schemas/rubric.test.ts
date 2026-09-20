import { describe, expect, it } from "vitest";
import { RubricSchema } from "./rubric.js";

describe("RubricSchema", () => {
  it("accepts an options rubric", () => {
    const result = RubricSchema.safeParse({
      kind: "options",
      scores: [{ optionId: "a", score: 2, feedback: "Reasonable." }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a freeText rubric", () => {
    const result = RubricSchema.safeParse({
      kind: "freeText",
      criteria: { mustMention: ["foliage"], mustNotMention: [], bonus: [] },
    });
    expect(result.success).toBe(true);
  });

  it("accepts a hybrid rubric", () => {
    const result = RubricSchema.safeParse({
      kind: "hybrid",
      scores: [{ optionId: "a", score: 1, feedback: "Plausible but incomplete." }],
      criteria: { mustMention: ["seasonal"], mustNotMention: [], bonus: ["foliage"] },
    });
    expect(result.success).toBe(true);
  });
});
