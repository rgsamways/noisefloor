import { describe, expect, it } from "vitest";
import { diurnalUsage } from "./diurnal-usage.js";

describe("diurnalUsage", () => {
  it("peaks within one hour of peakHour", () => {
    const series = diurnalUsage({ peakMbps: 35, peakHour: 22, offHours: [2, 3, 4], noise: 1 }, "seed-a");
    const peakPoint = series.reduce((max, p) => (p.v > max.v ? p : max));
    const hh = Number(peakPoint.t.split(":")[0]);
    const circularDistance = Math.min(Math.abs(hh - 22), 24 - Math.abs(hh - 22));
    expect(circularDistance).toBeLessThanOrEqual(1);
  });

  it("is deterministic for the same seed", () => {
    const a = diurnalUsage({ peakMbps: 35, peakHour: 22, offHours: [2, 3], noise: 1 }, "same-seed");
    const b = diurnalUsage({ peakMbps: 35, peakHour: 22, offHours: [2, 3], noise: 1 }, "same-seed");
    expect(a).toEqual(b);
  });

  it("keeps off-hours near zero", () => {
    const series = diurnalUsage({ peakMbps: 35, peakHour: 22, offHours: [2], noise: 1 }, "seed-b");
    const offHourPoints = series.filter((p) => Number(p.t.split(":")[0]) === 2);
    for (const point of offHourPoints) {
      expect(point.v).toBeLessThan(1);
    }
  });
});
