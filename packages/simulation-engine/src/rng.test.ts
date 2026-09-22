import { describe, expect, it } from "vitest";
import { createRng } from "./rng.js";

describe("createRng", () => {
  it("produces the same sequence for the same seed", () => {
    const a = createRng("wind-misalignment");
    const b = createRng("wind-misalignment");
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("produces a different sequence for a different seed", () => {
    const a = createRng("seed-a");
    const b = createRng("seed-b");
    expect(a()).not.toBe(b());
  });
});
