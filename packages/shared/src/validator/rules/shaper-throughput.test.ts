import { describe, expect, it } from "vitest";
import { createConsistentWorld } from "../fixtures.js";
import { checkShaperThroughput } from "./shaper-throughput.js";

describe("checkShaperThroughput", () => {
  it("flags a case-001-style shaper collapse to a sub-1-Mbit/s plateau", () => {
    const base = createConsistentWorld();
    const world = createConsistentWorld({
      events: [{ at: "11:52", label: "config change on CPE by T1 (shaper)" }],
      series: {
        ...base.series,
        throughputRx1h: { gen: "shaperCollapse", params: { at: "11:56", toKbps: 50 } },
      },
    });
    const tensions = checkShaperThroughput(world, "test-seed");
    expect(tensions).toHaveLength(1);
    expect(tensions[0]!.severity).toBe("soft");
    expect(tensions[0]!.rule).toBe("shaper.suspiciously-low-post-event-throughput");
  });

  it("does not flag a shaper event with no throughput collapse", () => {
    const base = createConsistentWorld();
    const world = createConsistentWorld({
      events: [{ at: "11:52", label: "config change on CPE by T1 (shaper)" }],
      series: {
        ...base.series,
        throughputRx1h: [
          { t: "11:00", v: 30000 },
          { t: "11:52", v: 30000 },
          { t: "12:00", v: 30000 },
          { t: "12:01", v: 30000 },
          { t: "12:02", v: 30000 },
          { t: "12:03", v: 30000 },
          { t: "12:04", v: 30000 },
        ],
      },
    });
    expect(checkShaperThroughput(world, "test-seed")).toEqual([]);
  });

  it("does nothing when there's no shaper-related event", () => {
    const world = createConsistentWorld();
    expect(checkShaperThroughput(world, "test-seed")).toEqual([]);
  });
});
