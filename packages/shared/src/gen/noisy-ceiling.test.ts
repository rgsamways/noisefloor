import { describe, expect, it } from "vitest";
import { noisyCeiling } from "./noisy-ceiling.js";

describe("noisyCeiling", () => {
  it("stays within jitter bounds with no spikes", () => {
    const series = noisyCeiling({ base: 60, jitter: 5 }, "seed-a");
    for (const point of series) {
      expect(point.v).toBeGreaterThanOrEqual(55);
      expect(point.v).toBeLessThanOrEqual(65);
    }
  });

  it("applies a spike at its configured index", () => {
    const series = noisyCeiling({ base: 60, jitter: 5, spikes: [{ at: 10, delta: 20 }] }, "seed-b");
    expect(series[10]!.v).toBeGreaterThan(65);
  });

  it("is deterministic for the same seed", () => {
    const a = noisyCeiling({ base: 60, jitter: 5 }, "same-seed");
    const b = noisyCeiling({ base: 60, jitter: 5 }, "same-seed");
    expect(a).toEqual(b);
  });
});
