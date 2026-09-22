import type { LinkProfile } from "@noisefloor/console-schema";

export type LinkBaseline = {
  linkHealth: number; // 0-1, this profile's "fully healthy" linkHealth
  signalDbm: number; // this profile's "fully healthy" signal reading
};

// Explicitly approximate: a longer path implies a weaker healthy-baseline
// signal, and gear tagged as a lower-tier gearClass drops it further.
// This is not a propagation model (see design.md Non-Goals) — it exists
// only to make two different LinkProfiles produce two different, each
// internally-consistent, healthy baselines. Confirmed on review that
// distance has real relevance here; expect this mapping to be adjusted
// once checked against real numbers.
const BASE_SIGNAL_DBM = -50;
const DB_LOSS_PER_KM = 2.2;
const MIN_SIGNAL_DBM = -85;
const MAX_SIGNAL_DBM = -45;

const GEAR_CLASS_PENALTY_DB: Record<string, number> = {
  backhaul: -3, // higher-power, higher-gain gear tolerates more path loss
  sector: 0,
  cpe: 0,
};

function gearClassPenaltyDb(gearClass: string): number {
  const key = gearClass.toLowerCase();
  for (const [needle, penalty] of Object.entries(GEAR_CLASS_PENALTY_DB)) {
    if (key.includes(needle)) return penalty;
  }
  return 0; // unrecognized gearClass: no adjustment, not a guess
}

export function linkProfileBaseline(profile: LinkProfile): LinkBaseline {
  const rawSignal = BASE_SIGNAL_DBM - profile.distanceKm * DB_LOSS_PER_KM + gearClassPenaltyDb(profile.gearClass);
  const signalDbm = Math.min(MAX_SIGNAL_DBM, Math.max(MIN_SIGNAL_DBM, rawSignal));

  // Map the healthy signal range onto a 0.5-1.0 linkHealth range — a
  // healthy link is never simulated as fully "0 health," it's judged
  // relative to its own profile per handoff §6.3.
  const span = MAX_SIGNAL_DBM - MIN_SIGNAL_DBM;
  const linkHealth = 0.5 + 0.5 * ((signalDbm - MIN_SIGNAL_DBM) / span);

  return { linkHealth, signalDbm };
}
