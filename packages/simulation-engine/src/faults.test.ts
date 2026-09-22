import { describe, expect, it } from "vitest";
import {
  combinedFaultEffect,
  type StepFault,
  type RampRecoverFault,
  type RampPersistFault,
  type IntermittentCycleFault,
} from "./faults.js";

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

describe("rampPersist fault", () => {
  const fault: RampPersistFault = {
    shape: "rampPersist",
    startAtSec: 0,
    rampSec: 100,
    target: "linkHealth",
    delta: -0.5,
  };

  it("has no effect before startAt", () => {
    expect(combinedFaultEffect([fault], -1).linkHealthDelta).toBe(0);
  });

  it("reaches full magnitude at startAtSec + rampSec and stays there long after", () => {
    expect(combinedFaultEffect([fault], 100).linkHealthDelta).toBeCloseTo(-0.5);
    expect(combinedFaultEffect([fault], 1_000_000).linkHealthDelta).toBeCloseTo(-0.5);
  });

  it("never recovers, unlike rampRecover", () => {
    // Same delta/rampSec as a rampRecover fault would eventually zero out;
    // rampPersist should not.
    expect(combinedFaultEffect([fault], 50_000).linkHealthDelta).toBeLessThan(0);
  });

  it("can target chainImbalanceDb directly, like step can", () => {
    const chainFault: RampPersistFault = {
      shape: "rampPersist",
      startAtSec: 0,
      rampSec: 10,
      target: "chainImbalanceDb",
      delta: 6,
    };
    expect(combinedFaultEffect([chainFault], 10).chainImbalanceDeltaDb).toBeCloseTo(6);
  });
});

describe("intermittentCycle fault", () => {
  const fault: IntermittentCycleFault = {
    shape: "intermittentCycle",
    startAtSec: 0,
    cyclePeriodSec: 100,
    activeDurationSec: 20,
    target: "linkHealth",
    delta: -0.4,
  };

  it("has no effect before startAt", () => {
    expect(combinedFaultEffect([fault], -1).linkHealthDelta).toBe(0);
  });

  it("is active inside the active window of a cycle and inactive outside it", () => {
    expect(combinedFaultEffect([fault], 10).linkHealthDelta).toBeCloseTo(-0.4);
    expect(combinedFaultEffect([fault], 50).linkHealthDelta).toBe(0);
  });

  it("repeats the same pattern in later cycles", () => {
    expect(combinedFaultEffect([fault], 210).linkHealthDelta).toBeCloseTo(-0.4); // 210 % 100 = 10
    expect(combinedFaultEffect([fault], 250).linkHealthDelta).toBe(0); // 250 % 100 = 50
  });
});
