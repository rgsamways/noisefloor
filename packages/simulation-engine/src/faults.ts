export type StepFault = {
  shape: "step";
  startAtSec: number;
  // "linkHealth": generic degradation of the shared scalar every dependent
  // field reads from. "chainImbalanceDb": bypasses the scalar and steps
  // that one field directly — wind misalignment's real signature (see
  // design.md), not a generic "signal got worse."
  target: "linkHealth" | "chainImbalanceDb";
  delta: number;
};

export type RampRecoverFault = {
  shape: "rampRecover";
  startAtSec: number;
  rampSec: number;
  holdSec: number;
  recoverSec: number;
  target: "linkHealth";
  delta: number; // negative degrades linkHealth at the fault's peak
};

export type RampPersistFault = {
  shape: "rampPersist";
  startAtSec: number;
  rampSec: number;
  // Same dual-target split as StepFault: a gradual onset that either
  // degrades the shared scalar or steps chainImbalanceDb directly.
  target: "linkHealth" | "chainImbalanceDb";
  delta: number;
};

export type IntermittentCycleFault = {
  shape: "intermittentCycle";
  startAtSec: number;
  cyclePeriodSec: number;
  activeDurationSec: number;
  target: "linkHealth";
  delta: number;
};

export type FaultDefinition = StepFault | RampRecoverFault | RampPersistFault | IntermittentCycleFault;

export type FaultEffect = {
  linkHealthDelta: number;
  chainImbalanceDeltaDb: number;
};

const NO_EFFECT: FaultEffect = { linkHealthDelta: 0, chainImbalanceDeltaDb: 0 };

function stepEffectAt(fault: StepFault, atSec: number): FaultEffect {
  if (atSec < fault.startAtSec) return NO_EFFECT;
  return fault.target === "linkHealth"
    ? { linkHealthDelta: fault.delta, chainImbalanceDeltaDb: 0 }
    : { linkHealthDelta: 0, chainImbalanceDeltaDb: fault.delta };
}

function rampRecoverEffectAt(fault: RampRecoverFault, atSec: number): FaultEffect {
  const t = atSec - fault.startAtSec;
  if (t < 0) return NO_EFFECT;

  const rampEnd = fault.rampSec;
  const holdEnd = rampEnd + fault.holdSec;
  const recoverEnd = holdEnd + fault.recoverSec;

  let frac: number; // 0 = no effect yet/anymore, 1 = full effect
  if (t < rampEnd) {
    frac = fault.rampSec === 0 ? 1 : t / fault.rampSec;
  } else if (t < holdEnd) {
    frac = 1;
  } else if (t < recoverEnd) {
    frac = fault.recoverSec === 0 ? 0 : 1 - (t - holdEnd) / fault.recoverSec;
  } else {
    frac = 0;
  }
  return { linkHealthDelta: fault.delta * frac, chainImbalanceDeltaDb: 0 };
}

// Ramps in over rampSec like rampRecoverEffectAt's ramp phase, then holds
// the full effect indefinitely — no hold/recover phase to compute, unlike
// rampRecover. A strict subset of that state machine, not new math.
function rampPersistEffectAt(fault: RampPersistFault, atSec: number): FaultEffect {
  const t = atSec - fault.startAtSec;
  if (t < 0) return NO_EFFECT;
  const frac = fault.rampSec === 0 ? 1 : Math.min(1, t / fault.rampSec);
  return fault.target === "linkHealth"
    ? { linkHealthDelta: fault.delta * frac, chainImbalanceDeltaDb: 0 }
    : { linkHealthDelta: 0, chainImbalanceDeltaDb: fault.delta * frac };
}

// A hard on/off gate repeating every cyclePeriodSec — active (full effect)
// for the first activeDurationSec of each cycle, inactive for the rest.
// Interference is bursty, not gradual, so this deliberately doesn't ramp.
function intermittentCycleEffectAt(fault: IntermittentCycleFault, atSec: number): FaultEffect {
  const t = atSec - fault.startAtSec;
  if (t < 0) return NO_EFFECT;
  const phase = t % fault.cyclePeriodSec;
  if (phase >= fault.activeDurationSec) return NO_EFFECT;
  return { linkHealthDelta: fault.delta, chainImbalanceDeltaDb: 0 };
}

export function faultEffectAt(fault: FaultDefinition, atSec: number): FaultEffect {
  switch (fault.shape) {
    case "step":
      return stepEffectAt(fault, atSec);
    case "rampRecover":
      return rampRecoverEffectAt(fault, atSec);
    case "rampPersist":
      return rampPersistEffectAt(fault, atSec);
    case "intermittentCycle":
      return intermittentCycleEffectAt(fault, atSec);
  }
}

export function combinedFaultEffect(faults: readonly FaultDefinition[], atSec: number): FaultEffect {
  return faults.reduce<FaultEffect>((acc, fault) => {
    const effect = faultEffectAt(fault, atSec);
    return {
      linkHealthDelta: acc.linkHealthDelta + effect.linkHealthDelta,
      chainImbalanceDeltaDb: acc.chainImbalanceDeltaDb + effect.chainImbalanceDeltaDb,
    };
  }, NO_EFFECT);
}

// Named presets — each a parameterization of one of the two shapes above,
// not new mechanism (handoff §6.4 extensibility requirement).

// Field-confirmed: alignment problems are obvious once chain delta reaches
// roughly 5 dB or more, and it stays that way rather than self-correcting.
// Default `toDb` of 6 clears that threshold even against a small healthy
// baseline chain imbalance.
export function windMisalignmentFault(startAtSec: number, opts: { toDb?: number } = {}): StepFault {
  return { shape: "step", startAtSec, target: "chainImbalanceDb", delta: opts.toDb ?? 6 };
}

// Real rain fade duration tracks how long the rain lasts — minutes to
// multiple hours — so every duration here is caller-supplied, not a
// built-in timescale.
export function rainFadeFault(
  startAtSec: number,
  opts: { rampSec: number; holdSec?: number; recoverSec: number; magnitude?: number },
): RampRecoverFault {
  return {
    shape: "rampRecover",
    startAtSec,
    rampSec: opts.rampSec,
    holdSec: opts.holdSec ?? 0,
    recoverSec: opts.recoverSec,
    target: "linkHealth",
    delta: -(opts.magnitude ?? 0.4),
  };
}

// handoff §6.2: "foliage growth — seasonal, gradual." Targets linkHealth:
// leaves attenuate the whole path, not one chain differentially.
export function foliageGrowthFault(
  startAtSec: number,
  opts: { rampSec: number; magnitude?: number },
): RampPersistFault {
  return {
    shape: "rampPersist",
    startAtSec,
    rampSec: opts.rampSec,
    target: "linkHealth",
    delta: -(opts.magnitude ?? 0.3),
  };
}

const SECONDS_PER_DAY = 24 * 60 * 60;

// handoff §6.2: "interference — intermittent, often a daily rhythm."
// cyclePeriodSec defaults to a day; every other parameter is
// caller-supplied since "often" isn't "always." No per-cycle jitter in
// this pass — deferred as a follow-up (design.md), not built here.
export function interferenceFault(
  startAtSec: number,
  opts: { cyclePeriodSec?: number; activeDurationSec: number; magnitude?: number },
): IntermittentCycleFault {
  return {
    shape: "intermittentCycle",
    startAtSec,
    cyclePeriodSec: opts.cyclePeriodSec ?? SECONDS_PER_DAY,
    activeDurationSec: opts.activeDurationSec,
    target: "linkHealth",
    delta: -(opts.magnitude ?? 0.35),
  };
}
