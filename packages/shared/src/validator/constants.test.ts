import { describe, expect, it } from "vitest";
import { expectedRateForCinr } from "./constants.js";

describe("expectedRateForCinr", () => {
  it("returns the highest rate the given CINR could sustain", () => {
    expect(expectedRateForCinr(21)).toBe(6);
    expect(expectedRateForCinr(30)).toBe(8);
    expect(expectedRateForCinr(0)).toBe(1);
  });

  it("returns a rate just below the next threshold when short of it", () => {
    expect(expectedRateForCinr(20)).toBe(5);
    expect(expectedRateForCinr(29)).toBe(7);
  });
});
