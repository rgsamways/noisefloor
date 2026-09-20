import { describe, expect, it } from "vitest";
import { DeviceSchema } from "./world.js";

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
