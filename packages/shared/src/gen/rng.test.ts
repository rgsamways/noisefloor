import { describe, expect, it } from "vitest";
import { createRng } from "./rng.js";

describe("createRng", () => {
  it("produces the same sequence for the same string seed", () => {
    const a = createRng("c001-wet-leaves");
    const b = createRng("c001-wet-leaves");
    const sequenceA = Array.from({ length: 10 }, () => a());
    const sequenceB = Array.from({ length: 10 }, () => b());
    expect(sequenceA).toEqual(sequenceB);
  });

  it("produces a different sequence for a different seed", () => {
    const a = createRng("c001-wet-leaves");
    const b = createRng("c002-something-else");
    expect(a()).not.toBe(b());
  });

  it("produces values within [0, 1)", () => {
    const rng = createRng(42);
    for (let i = 0; i < 100; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
