import { describe, expect, it } from "vitest";
import { RadioLinkTelemetrySchema, type LinkProfile } from "@noisefloor/console-schema";
import { simulateRadioLink, type SimulationConfig } from "./simulate.js";
import { windMisalignmentFault, rainFadeFault, foliageGrowthFault, interferenceFault } from "./faults.js";

const profile: LinkProfile = { distanceKm: 3.1, band: "5.8GHz", gearClass: "sector" };
const baseTimeIso = "2026-09-21T00:00:00.000Z";

function config(overrides: Partial<SimulationConfig> = {}): SimulationConfig {
  return { linkProfile: profile, seed: "test-seed", baseTimeIso, ...overrides };
}

describe("simulateRadioLink — determinism", () => {
  it("produces identical output for the same seed and time", () => {
    const a = simulateRadioLink(config(), 120);
    const b = simulateRadioLink(config(), 120);
    expect(a).toEqual(b);
  });

  it("produces different jitter for a different seed at the same time", () => {
    const a = simulateRadioLink(config({ seed: "seed-a" }), 120);
    const b = simulateRadioLink(config({ seed: "seed-b" }), 120);
    expect(a.link.signalDbm.value).not.toBe(b.link.signalDbm.value);
  });
});

describe("simulateRadioLink — healthy baseline", () => {
  it("produces a fully valid RadioLinkTelemetry with no active fault", () => {
    const snapshot = simulateRadioLink(config(), 0);
    const result = RadioLinkTelemetrySchema.safeParse(snapshot);
    expect(result.success).toBe(true);
  });
});

describe("simulateRadioLink — wind misalignment", () => {
  it("steps chainImbalanceDb to roughly 5 dB or greater and keeps it there", () => {
    const scenario = { faults: [...windMisalignmentFault(60)] };
    const before = simulateRadioLink(config({ scenario }), 30);
    const justAfter = simulateRadioLink(config({ scenario }), 60);
    const longAfter = simulateRadioLink(config({ scenario }), 60_000);

    expect(before.link.chainImbalanceDb.value).toBeLessThan(5);
    expect(justAfter.link.chainImbalanceDb.value).toBeGreaterThanOrEqual(5);
    expect(longAfter.link.chainImbalanceDb.value).toBeGreaterThanOrEqual(5);
  });

  it("also steps signal/SNR down and stays down, while noise floor is unaffected", () => {
    const scenario = { faults: [...windMisalignmentFault(60)] };
    const before = simulateRadioLink(config({ scenario }), 30);
    const justAfter = simulateRadioLink(config({ scenario }), 60);
    const longAfter = simulateRadioLink(config({ scenario }), 60_000);

    expect(justAfter.link.signalDbm.value).toBeLessThan(before.link.signalDbm.value);
    expect(justAfter.link.snrDb.value).toBeLessThan(before.link.snrDb.value);
    expect(longAfter.link.signalDbm.value).toBeLessThan(before.link.signalDbm.value);
    expect(Math.abs(longAfter.link.noiseFloorDbm.value - before.link.noiseFloorDbm.value)).toBeLessThan(2);
  });
});

describe("simulateRadioLink — rain fade", () => {
  it("ramps down, hits a low point, and recovers over a short (minutes) duration", () => {
    const scenario = { faults: [rainFadeFault(0, { rampSec: 300, holdSec: 300, recoverSec: 300 })] };
    const healthy = simulateRadioLink(config(), -1);
    const lowPoint = simulateRadioLink(config({ scenario }), 400);
    const recovered = simulateRadioLink(config({ scenario }), 1000);

    expect(lowPoint.link.signalDbm.value).toBeLessThan(healthy.link.signalDbm.value);
    expect(Math.abs(recovered.link.signalDbm.value - healthy.link.signalDbm.value)).toBeLessThan(2);
  });

  it("supports an hours-long duration", () => {
    const scenario = {
      faults: [rainFadeFault(0, { rampSec: 3600, holdSec: 7200, recoverSec: 3600 })],
    };
    const healthy = simulateRadioLink(config(), -1);
    const lowPoint = simulateRadioLink(config({ scenario }), 5000);
    const recovered = simulateRadioLink(config({ scenario }), 14_400);

    expect(lowPoint.link.signalDbm.value).toBeLessThan(healthy.link.signalDbm.value);
    expect(Math.abs(recovered.link.signalDbm.value - healthy.link.signalDbm.value)).toBeLessThan(2);
  });
});

describe("simulateRadioLink — staleness / dead-poll", () => {
  it("freezes value and asOf after a far-end drop, while updating normally before it", () => {
    const scenario = { farEndDropAtSec: 300 };
    const beforeDrop = simulateRadioLink(config({ scenario }), 100);
    const atDrop = simulateRadioLink(config({ scenario }), 300);
    const longAfterDrop = simulateRadioLink(config({ scenario }), 10_000);

    // Updates normally before the drop.
    expect(beforeDrop.timeEvidence.lastSuccessfulPoll.asOf).not.toBe(atDrop.timeEvidence.lastSuccessfulPoll.asOf);

    // Frozen at (and after) the drop point.
    expect(longAfterDrop.link.signalDbm.value).toBe(atDrop.link.signalDbm.value);
    expect(longAfterDrop.link.signalDbm.asOf).toBe(atDrop.link.signalDbm.asOf);
    expect(longAfterDrop.farEnd.latencyMs.value).toBe(atDrop.farEnd.latencyMs.value);
    expect(longAfterDrop.farEnd.latencyMs.asOf).toBe(atDrop.farEnd.latencyMs.asOf);
    expect(longAfterDrop.timeEvidence.lastSuccessfulPoll.asOf).toBe(atDrop.timeEvidence.lastSuccessfulPoll.asOf);
  });
});

describe("simulateRadioLink — foliage growth", () => {
  it("ramps signal down over a seasonal-scale duration and plateaus", () => {
    const rampSec = 60 * 60 * 24 * 30 * 3; // ~3 months
    const scenario = { faults: [foliageGrowthFault(0, { rampSec })] };
    const healthy = simulateRadioLink(config(), -1);
    const plateaued = simulateRadioLink(config({ scenario }), rampSec * 2);

    expect(plateaued.link.signalDbm.value).toBeLessThan(healthy.link.signalDbm.value);
  });
});

describe("simulateRadioLink — interference", () => {
  it("raises noise floor (not signal) during active windows and matches healthy baseline outside them", () => {
    const scenario = { faults: [interferenceFault(0, { activeDurationSec: 3 * 60 * 60 })] }; // 3h/day active
    const healthy = simulateRadioLink(config(), -1);
    const duringWindow = simulateRadioLink(config({ scenario }), 60 * 60); // 1h in, inside the window
    const outsideWindow = simulateRadioLink(config({ scenario }), 12 * 60 * 60); // well outside the window

    expect(duringWindow.link.noiseFloorDbm.value).toBeGreaterThan(healthy.link.noiseFloorDbm.value);
    expect(Math.abs(duringWindow.link.signalDbm.value - healthy.link.signalDbm.value)).toBeLessThan(2);
    expect(duringWindow.link.linkQualityPct.value).toBeLessThan(healthy.link.linkQualityPct.value);
    expect(Math.abs(outsideWindow.link.noiseFloorDbm.value - healthy.link.noiseFloorDbm.value)).toBeLessThan(2);
  });
});
