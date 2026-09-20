import { CaseSchema, validateWorld } from "@noisefloor/shared";
import { describe, expect, it } from "vitest";
import { caseOne } from "./index.js";

describe("case 001 — wet leaves", () => {
  it("validates against CaseSchema", () => {
    expect(() => CaseSchema.parse(caseOne)).not.toThrow();
  });

  it("has no hard tensions in its World", () => {
    const tensions = validateWorld(caseOne.world, caseOne.id);
    const hard = tensions.filter((t) => t.severity === "hard");
    expect(hard).toEqual([]);
  });
});
