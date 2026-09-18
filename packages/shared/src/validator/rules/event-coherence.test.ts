import { describe, expect, it } from "vitest";
import { createConsistentWorld } from "../fixtures.js";
import { checkEventCoherence } from "./event-coherence.js";

const flatSeries = [
  { t: "11:00", v: 65 },
  { t: "12:00", v: 65 },
  { t: "12:01", v: 65 },
  { t: "12:02", v: 65 },
];

describe("checkEventCoherence", () => {
  it("does not flag an event reflected by a visible change in a series", () => {
    const base = createConsistentWorld();
    const world = createConsistentWorld({
      events: [{ at: "12:00", label: "config change on CPE by T1" }],
      series: {
        ...base.series,
        capacityDown24h: [
          { t: "11:00", v: 65 },
          { t: "12:00", v: 65 },
          { t: "12:01", v: 30 },
          { t: "12:02", v: 30 },
        ],
        usedDown24h: flatSeries,
        signalTrace24h: flatSeries.map((p) => ({ t: p.t, v: -69 })),
        throughputRx1h: flatSeries,
      },
    });
    expect(checkEventCoherence(world, "test-seed")).toEqual([]);
  });

  it("flags an event with no visible effect in any comparable series as hard", () => {
    const base = createConsistentWorld();
    const world = createConsistentWorld({
      events: [{ at: "12:00", label: "reboot" }],
      series: {
        ...base.series,
        capacityDown24h: flatSeries,
        usedDown24h: flatSeries,
        signalTrace24h: flatSeries.map((p) => ({ t: p.t, v: -69 })),
        throughputRx1h: flatSeries,
      },
    });
    const tensions = checkEventCoherence(world, "test-seed");
    expect(tensions).toHaveLength(1);
    expect(tensions[0]!.severity).toBe("hard");
    expect(tensions[0]!.rule).toBe("events.unreflected-in-series");
  });

  it("does not flag an event outside every series' covered range", () => {
    // createConsistentWorld's default series each have a single point at
    // 00:00 — an event at 18:00 has nothing to compare against.
    const world = createConsistentWorld({
      events: [{ at: "18:00", label: "reboot" }],
    });
    expect(checkEventCoherence(world, "test-seed")).toEqual([]);
  });
});
