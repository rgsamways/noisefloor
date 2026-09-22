import type { LinkProfile, RadioLinkTelemetry } from "@noisefloor/console-schema";
import { createRng } from "./rng.js";
import { readingAt } from "./reading.js";
import { linkProfileBaseline } from "./baseline.js";
import {
  deriveLinkGroup,
  deriveThroughputGroup,
  deriveFarEndGroup,
  deriveRadioHealthGroup,
} from "./link-health.js";
import { combinedFaultEffect, type FaultDefinition } from "./faults.js";

export type Scenario = {
  faults?: FaultDefinition[];
  // Simulated seconds at which the far end stops responding — the whole
  // snapshot freezes at its last successfully-polled state from this point
  // on (handoff §4b), not just one field group.
  farEndDropAtSec?: number;
};

export type SimulationConfig = {
  linkProfile: LinkProfile;
  seed: string | number;
  baseTimeIso: string;
  baseUptimeSeconds?: number;
  scenario?: Scenario;
};

// ~14 days, matching the console mockups' "UPTIME 14d 6h" placeholder.
const DEFAULT_BASE_UPTIME_SECONDS = 14 * 24 * 60 * 60;

export function simulateRadioLink(config: SimulationConfig, atSec: number): RadioLinkTelemetry {
  const scenario = config.scenario ?? {};
  const faults = scenario.faults ?? [];

  const effectiveAtSec =
    scenario.farEndDropAtSec !== undefined ? Math.min(atSec, scenario.farEndDropAtSec) : atSec;

  const baseline = linkProfileBaseline(config.linkProfile);
  const effect = combinedFaultEffect(faults, effectiveAtSec);
  const health = clamp(baseline.linkHealth + effect.linkHealthDelta, 0, 1);
  const baseUptimeSeconds = config.baseUptimeSeconds ?? DEFAULT_BASE_UPTIME_SECONDS;

  // One rng per call, seeded by (seed, effectiveAtSec) — same inputs
  // always produce the same output, and calls at different times don't
  // depend on call order (design.md's "pure function of time" goal).
  const rng = createRng(`${config.seed}:${effectiveAtSec}`);

  const link = deriveLinkGroup(health, baseline, effect.chainImbalanceDeltaDb, rng);
  const throughput = deriveThroughputGroup(health, rng);
  const farEnd = deriveFarEndGroup(health, config.linkProfile, rng);
  const radioHealth = deriveRadioHealthGroup(baseUptimeSeconds, effectiveAtSec, rng);

  const reading = <T>(value: T) => readingAt(value, config.baseTimeIso, effectiveAtSec);
  const lastRebootIso = new Date(
    new Date(config.baseTimeIso).getTime() - baseUptimeSeconds * 1000,
  ).toISOString();
  const nowIso = new Date(new Date(config.baseTimeIso).getTime() + effectiveAtSec * 1000).toISOString();

  return {
    link: {
      signalDbm: reading(link.signalDbm),
      noiseFloorDbm: reading(link.noiseFloorDbm),
      snrDb: reading(link.snrDb),
      linkQualityPct: reading(link.linkQualityPct),
      modulationIndex: reading(link.modulationIndex),
      frequencyMhz: reading(link.frequencyMhz),
      channelWidthMhz: reading(link.channelWidthMhz),
      linkState: reading(link.linkState),
      chainImbalanceDb: reading(link.chainImbalanceDb),
      txPowerDbm: reading(link.txPowerDbm),
    },
    throughput: {
      txRateMbps: reading(throughput.txRateMbps),
      rxRateMbps: reading(throughput.rxRateMbps),
      airtimePct: reading(throughput.airtimePct),
      channelUtilizationPct: reading(throughput.channelUtilizationPct),
      clientCount: reading(throughput.clientCount),
    },
    farEnd: {
      distanceKm: reading(farEnd.distanceKm),
      latencyMs: reading(farEnd.latencyMs),
      jitterMs: reading(farEnd.jitterMs),
      packetLossPct: reading(farEnd.packetLossPct),
      errorsRetries: reading(farEnd.errorsRetries),
    },
    radioHealth: {
      cpuPct: reading(radioHealth.cpuPct),
      ramPct: reading(radioHealth.ramPct),
      temperatureC: reading(radioHealth.temperatureC),
      uptimeSeconds: reading(radioHealth.uptimeSeconds),
    },
    timeEvidence: {
      lastReboot: reading(lastRebootIso),
      lastLogEntry: reading(nowIso),
      lastSuccessfulPoll: reading(nowIso),
    },
    vendorExtras: {},
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
