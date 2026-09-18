import { describe, expect, it } from "vitest";
import { createConsistentWorld } from "../fixtures.js";
import { checkRfLinkBudget } from "./rf-link-budget.js";

describe("checkRfLinkBudget", () => {
  it("passes a well-aligned link", () => {
    const world = createConsistentWorld();
    expect(checkRfLinkBudget(world)).toEqual([]);
  });

  it("flags a chain imbalance beyond 3 dB", () => {
    const world = createConsistentWorld({
      link: { ...createConsistentWorld().link, chainsLocal: [-69, -74] },
    });
    const tensions = checkRfLinkBudget(world);
    expect(tensions).toHaveLength(1);
    expect(tensions[0]!.severity).toBe("soft");
    expect(tensions[0]!.fields).toContain("link.chainsLocal");
  });
});
