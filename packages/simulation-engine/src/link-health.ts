import type { LinkProfile } from "@noisefloor/console-schema";
import type { LinkBaseline } from "./baseline.js";
import { jitter } from "./rng.js";

// Every field below is a deterministic function of the shared `linkHealth`
// scalar (plus small seeded jitter) — the mechanism that makes correlated
// movement automatic instead of something each fault has to remember to do
// per field (see design.md's Decisions).

const SIGNAL_DB_PER_HEALTH_UNIT = 50;
const NOISE_FLOOR_DBM = -92;
const BASE_CHAIN_IMBALANCE_DB = 1.5;
const MAX_TX_RATE_MBPS = 400;
const DOWN_HEALTH_THRESHOLD = 0.1;

export type LinkGroupValues = {
  signalDbm: number;
  noiseFloorDbm: number;
  snrDb: number;
  linkQualityPct: number;
  modulationIndex: number;
  frequencyMhz: number;
  channelWidthMhz: number;
  linkState: "connected" | "associating" | "down";
  chainImbalanceDb: number;
  txPowerDbm: number;
};

export function deriveLinkGroup(
  health: number,
  baseline: LinkBaseline,
  chainImbalanceDeltaDb: number,
  rng: () => number,
  noiseFloorDeltaDb = 0,
): LinkGroupValues {
  const deficit = baseline.linkHealth - health; // >= 0 once a fault degrades health
  const signalDbm = baseline.signalDbm - deficit * SIGNAL_DB_PER_HEALTH_UNIT + jitter(rng, 0.5);
  const noiseFloorDbm = NOISE_FLOOR_DBM + noiseFloorDeltaDb + jitter(rng, 1);
  const snrDb = signalDbm - noiseFloorDbm;

  // linkQualityPct/modulationIndex react to SNR loss regardless of whether
  // it came from signal dropping (health) or noise floor rising
  // (noiseFloorDeltaDb) — see design.md's Decision 4. snrDeficitDb folds
  // both sources onto the same dB scale via SIGNAL_DB_PER_HEALTH_UNIT, the
  // same conversion the signal axis already uses; snrHealth collapses to
  // `health` exactly when noiseFloorDeltaDb is 0 (every fault except
  // Interference), so this is a no-op for existing signal-axis faults.
  const snrDeficitDb = deficit * SIGNAL_DB_PER_HEALTH_UNIT + noiseFloorDeltaDb;
  const snrHealth = clamp(baseline.linkHealth - snrDeficitDb / SIGNAL_DB_PER_HEALTH_UNIT, 0, 1);
  const linkQualityPct = clamp(Math.round(snrHealth * 100), 0, 100);
  const modulationIndex = clamp(Math.round(snrHealth * 9), 0, 9);
  const chainImbalanceDb = Math.max(0, BASE_CHAIN_IMBALANCE_DB + jitter(rng, 0.3) + chainImbalanceDeltaDb);

  return {
    signalDbm,
    noiseFloorDbm,
    snrDb,
    linkQualityPct,
    modulationIndex,
    frequencyMhz: 5800,
    channelWidthMhz: 40,
    linkState: health <= DOWN_HEALTH_THRESHOLD ? "down" : "connected",
    chainImbalanceDb,
    txPowerDbm: 20 + jitter(rng, 0.5),
  };
}

export type ThroughputGroupValues = {
  txRateMbps: number;
  rxRateMbps: number;
  airtimePct: number;
  channelUtilizationPct: number;
  clientCount: number;
};

export function deriveThroughputGroup(health: number, rng: () => number): ThroughputGroupValues {
  const rate = Math.max(0, MAX_TX_RATE_MBPS * health + jitter(rng, MAX_TX_RATE_MBPS * 0.02));
  return {
    txRateMbps: rate,
    rxRateMbps: Math.max(0, rate + jitter(rng, MAX_TX_RATE_MBPS * 0.02)),
    airtimePct: clamp(25 + jitter(rng, 5), 0, 100),
    channelUtilizationPct: clamp(30 + jitter(rng, 5), 0, 100),
    clientCount: Math.max(0, Math.round(4 + jitter(rng, 1))),
  };
}

export type FarEndGroupValues = {
  distanceKm: number;
  latencyMs: number;
  jitterMs: number;
  packetLossPct: number;
  errorsRetries: number;
};

export function deriveFarEndGroup(health: number, profile: LinkProfile, rng: () => number): FarEndGroupValues {
  const deficit = Math.max(0, 1 - health);
  return {
    distanceKm: profile.distanceKm,
    latencyMs: Math.max(0.1, 2 + deficit * 8 + jitter(rng, 0.3)),
    jitterMs: Math.max(0, 0.5 + deficit * 3 + jitter(rng, 0.2)),
    packetLossPct: clamp(deficit * 8 + jitter(rng, 0.2), 0, 100),
    errorsRetries: Math.max(0, Math.round(deficit * 40 + jitter(rng, 1))),
  };
}

export type RadioHealthGroupValues = {
  cpuPct: number;
  ramPct: number;
  temperatureC: number;
  uptimeSeconds: number;
};

export function deriveRadioHealthGroup(baseUptimeSeconds: number, atSec: number, rng: () => number): RadioHealthGroupValues {
  return {
    cpuPct: clamp(18 + jitter(rng, 4), 0, 100),
    ramPct: clamp(44 + jitter(rng, 4), 0, 100),
    temperatureC: 41 + jitter(rng, 2),
    uptimeSeconds: Math.max(0, baseUptimeSeconds + atSec),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
