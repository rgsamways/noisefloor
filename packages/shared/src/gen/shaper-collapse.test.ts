import { describe, expect, it } from "vitest";
import { shaperCollapse } from "./shaper-collapse.js";

describe("shaperCollapse", () => {
  it("collapses to toKbps at and after the configured time, and leaves before it unaffected", () => {
    const series = shaperCollapse({ at: "11:56", toKbps: 50 }, "seed-a");
    const atMinute = 11 * 60 + 56;

    for (const point of series) {
      const [h, m] = point.t.split(":").map(Number);
      const minuteOfDay = h! * 60 + m!;
      if (minuteOfDay >= atMinute) {
        expect(point.v).toBeLessThan(200);
      } else {
        expect(point.v).toBeGreaterThan(1000);
      }
    }
  });

  it("is deterministic for the same seed", () => {
    const a = shaperCollapse({ at: "11:56", toKbps: 50 }, "same-seed");
    const b = shaperCollapse({ at: "11:56", toKbps: 50 }, "same-seed");
    expect(a).toEqual(b);
  });
});
