import { describe, expect, it } from "vitest";
import { resolvePinglogRef, resolveSeriesRef } from "./resolve-series-ref.js";

describe("resolveSeriesRef", () => {
  it("passes inline points through unchanged", () => {
    const inline = [{ t: "00:00", v: 1 }, { t: "00:15", v: 2 }];
    expect(resolveSeriesRef(inline, "seed")).toEqual(inline);
  });

  it("resolves a generator spec to the same shape as inline points", () => {
    const resolved = resolveSeriesRef({ gen: "noisyCeiling", params: { base: 60, jitter: 5 } }, "seed");
    expect(Array.isArray(resolved)).toBe(true);
    expect(resolved[0]).toHaveProperty("t");
    expect(resolved[0]).toHaveProperty("v");
  });
});

describe("resolvePinglogRef", () => {
  it("passes an inline grid through unchanged", () => {
    const inline = { days: 1, bucketMinutes: 60, grid: [["ok" as const]] };
    expect(resolvePinglogRef(inline, "seed")).toEqual(inline);
  });

  it("resolves a pinglogMonth generator spec to a grid", () => {
    const resolved = resolvePinglogRef({ gen: "pinglogMonth", params: { baseLossPct: 0 } }, "seed");
    expect(resolved.grid.length).toBeGreaterThan(0);
  });
});
