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

export type FaultDefinition = StepFault | RampRecoverFault;

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

export function faultEffectAt(fault: FaultDefinition, atSec: number): FaultEffect {
  return fault.shape === "step" ? stepEffectAt(fault, atSec) : rampRecoverEffectAt(fault, atSec);
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
