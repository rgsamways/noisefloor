import { describe, expect, it } from "vitest";
import { createConsistentWorld } from "../fixtures.js";
import { checkCapacityBudget } from "./capacity-budget.js";

describe("checkCapacityBudget", () => {
  it("passes capacity within the achievable band", () => {
    const world = createConsistentWorld();
    expect(checkCapacityBudget(world)).toEqual([]);
  });

  it("allows case 001's own down/up asymmetry without a hard tension", () => {
    // NOISEFLOOR-OUTLINE.md §9: 20 MHz, 6X both directions, 66 down / 93 up.
    const base = createConsistentWorld();
    const world = createConsistentWorld({
      site: { ...base.site, widthMHz: 20 },
      link: { ...base.link, rateLocal: 6, rateRemote: 6, capacityDownMbps: 66, capacityUpMbps: 93 },
    });
    const tensions = checkCapacityBudget(world);
    expect(tensions.some((t) => t.severity === "hard")).toBe(false);
  });

  it("flags a wildly impossible capacity as hard", () => {
    const base = createConsistentWorld();
    const world = createConsistentWorld({
      site: { ...base.site, widthMHz: 20 },
      link: { ...base.link, rateLocal: 6, capacityDownMbps: 500 },
    });
    const tensions = checkCapacityBudget(world);
    const hard = tensions.find((t) => t.rule === "capacity.outside-achievable-band");
    expect(hard).toBeDefined();
    expect(hard!.severity).toBe("hard");
  });
});
