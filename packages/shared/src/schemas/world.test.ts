import { describe, expect, it } from "vitest";
import { createConsistentWorld } from "../validator/fixtures.js";
import { DeviceSchema, WorldSchema } from "./world.js";

const baseDevice = {
  model: "PowerBeam-class",
  mode: "router" as const,
  firmware: "8.7.11",
  uptimeHours: 66,
  memoryPct: 78,
  cpuPct: 20,
  cableSnrDb: 27,
  cableLengthM: 28,
};

describe("DeviceSchema", () => {
  it("validates without mac/txPowerDbm/lanSpeedMbps", () => {
    expect(() => DeviceSchema.parse(baseDevice)).not.toThrow();
  });

  it("validates with mac/txPowerDbm/lanSpeedMbps set", () => {
    expect(() =>
      DeviceSchema.parse({ ...baseDevice, mac: "00:15:6D:AA:BB:CC", txPowerDbm: 24, lanSpeedMbps: 1000 }),
    ).not.toThrow();
  });
});

describe("WorldSchema", () => {
  it("validates without realtimePings/deviceBackups/throughputTx1h", () => {
    const world = createConsistentWorld();
    expect(() => WorldSchema.parse(world)).not.toThrow();
  });

  it("validates with realtimePings/deviceBackups/throughputTx1h set", () => {
    const base = createConsistentWorld();
    const world = {
      ...base,
      series: { ...base.series, throughputTx1h: [{ t: "00:00", v: 30000 }] },
      realtimePings: [{ targetLabel: "M. Ferrier", samples: [64, 66, null, 65] }],
      deviceBackups: [{ label: "Nightly config backup", at: "2026-09-19T02:00:00Z" }],
    };
    expect(() => WorldSchema.parse(world)).not.toThrow();
  });
});
