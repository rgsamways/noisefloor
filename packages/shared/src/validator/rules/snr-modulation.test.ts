import { describe, expect, it } from "vitest";
import { createConsistentWorld } from "../fixtures.js";
import { checkSnrModulation } from "./snr-modulation.js";

describe("checkSnrModulation", () => {
  it("passes a consistent link", () => {
    const world = createConsistentWorld();
    expect(checkSnrModulation(world)).toEqual([]);
  });

  it("flags a modulation rate the CINR can't support as hard", () => {
    const base = createConsistentWorld();
    const world = createConsistentWorld({
      link: { ...base.link, rateLocal: 8, cinrLocalDb: 15 },
    });
    const tensions = checkSnrModulation(world);
    const hard = tensions.find((t) => t.rule === "snr.rate-exceeds-cinr");
    expect(hard).toBeDefined();
    expect(hard!.severity).toBe("hard");
  });

  it("flags a rate well below what CINR could support as soft", () => {
    const base = createConsistentWorld();
    const world = createConsistentWorld({
      link: { ...base.link, rateLocal: 1, cinrLocalDb: 35 },
    });
    const tensions = checkSnrModulation(world);
    const soft = tensions.find((t) => t.rule === "snr.rate-below-cinr-capability");
    expect(soft).toBeDefined();
    expect(soft!.severity).toBe("soft");
  });

  it("flags CINR that doesn't match signal minus noise floor", () => {
    const base = createConsistentWorld();
    const world = createConsistentWorld({
      link: { ...base.link, cinrLocalDb: 5 },
    });
    const tensions = checkSnrModulation(world);
    const mismatch = tensions.find((t) => t.rule === "snr.cinr-inconsistent-with-signal-noise");
    expect(mismatch).toBeDefined();
    expect(mismatch!.severity).toBe("soft");
  });
});
