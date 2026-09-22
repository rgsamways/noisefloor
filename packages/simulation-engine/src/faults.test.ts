import { describe, expect, it } from "vitest";
import { combinedFaultEffect, type StepFault, type RampRecoverFault } from "./faults.js";

describe("step fault", () => {
  const fault: StepFault = { shape: "step", startAtSec: 100, target: "linkHealth", delta: -0.3 };

  it("has no effect before startAt", () => {
    expect(combinedFaultEffect([fault], 50).linkHealthDelta).toBe(0);
  });

  it("shifts within one snapshot of startAt and stays shifted long after", () => {
    expect(combinedFaultEffect([fault], 100).linkHealthDelta).toBe(-0.3);
    expect(combinedFaultEffect([fault], 100_000).linkHealthDelta).toBe(-0.3);
  });
});

describe("rampRecover fault", () => {
  const fault: RampRecoverFault = {
    shape: "rampRecover",
    startAtSec: 0,
    rampSec: 60,
    holdSec: 60,
    recoverSec: 60,
    target: "linkHealth",
    delta: -0.4,
  };

  it("has no effect before startAt", () => {
    expect(combinedFaultEffect([fault], -1).linkHealthDelta).toBe(0);
  });

  it("ramps in, degrading progressively toward the low point", () => {
    const at30 = combinedFaultEffect([fault], 30).linkHealthDelta;
    const at59 = combinedFaultEffect([fault], 59).linkHealthDelta;
    expect(at30).toBeLessThan(0);
    expect(at59).toBeLessThan(at30);
  });

  it("holds at the low point during the hold window", () => {
    expect(combinedFaultEffect([fault], 60).linkHealthDelta).toBeCloseTo(-0.4);
    expect(combinedFaultEffect([fault], 119).linkHealthDelta).toBeCloseTo(-0.4);
  });

  it("recovers back to no effect by the end of the full duration", () => {
    expect(combinedFaultEffect([fault], 180).linkHealthDelta).toBeCloseTo(0);
    expect(combinedFaultEffect([fault], 500).linkHealthDelta).toBe(0);
  });

  it("supports an hours-long duration, not just minutes", () => {
    const hoursLong: RampRecoverFault = {
      shape: "rampRecover",
      startAtSec: 0,
      rampSec: 3600,
      holdSec: 7200,
      recoverSec: 3600,
      target: "linkHealth",
      delta: -0.3,
    };
    expect(combinedFaultEffect([hoursLong], 1800).linkHealthDelta).toBeLessThan(0);
    expect(combinedFaultEffect([hoursLong], 5000).linkHealthDelta).toBeCloseTo(-0.3);
    expect(combinedFaultEffect([hoursLong], 14400).linkHealthDelta).toBeCloseTo(0);
  });
});
