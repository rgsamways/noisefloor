import { describe, expect, it } from "vitest";
import { SCENARIOS, type ScenarioKey } from "./console-scenarios.js";

const ALL_KEYS: ScenarioKey[] = [
  "healthy",
  "windMisalignment",
  "rainFade",
  "cableDegradation",
  "foliageGrowth",
  "interference",
  "expiredLease",
  "doubleNat",
  "customerRouterOffline",
  "wrongBootOrder",
];

const RADIO_LINK_FAULT_SCENARIOS: ScenarioKey[] = ["windMisalignment", "rainFade", "foliageGrowth", "interference"];

describe("console scenarios", () => {
  it("defines exactly the 10 named scenarios", () => {
    expect(Object.keys(SCENARIOS).sort()).toEqual([...ALL_KEYS].sort());
  });

  it("puts every radio-link fault on the LOCAL (CPE) side, not REMOTE", () => {
    for (const key of RADIO_LINK_FAULT_SCENARIOS) {
      const def = SCENARIOS[key];
      expect(def.local?.scenario?.faults?.length, `${key} should have a LOCAL fault`).toBeGreaterThan(0);
      expect(def.remote?.scenario?.faults, `${key} should not touch REMOTE`).toBeUndefined();
    }
  });

  it("Cable Degradation is a service-layer fault that leaves the radio link untouched", () => {
    const def = SCENARIOS.cableDegradation;
    expect(def.serviceLayer?.scenario?.faults?.length).toBeGreaterThan(0);
    expect(def.local?.scenario?.faults ?? []).toHaveLength(0);
    expect(def.remote?.scenario?.faults ?? []).toHaveLength(0);
  });

  it("Wrong Boot Order sets a service-layer fault and a low LOCAL baseUptimeSeconds", () => {
    const def = SCENARIOS.wrongBootOrder;
    expect(def.serviceLayer?.scenario?.faults?.length).toBeGreaterThan(0);
    expect(def.local?.baseUptimeSeconds).toBeDefined();
    // "Low" relative to simulation-engine's 14-day default.
    expect(def.local!.baseUptimeSeconds!).toBeLessThan(24 * 60 * 60);
  });

  it("Healthy has no faults anywhere", () => {
    const def = SCENARIOS.healthy;
    expect(def.local?.scenario?.faults ?? []).toHaveLength(0);
    expect(def.remote?.scenario?.faults ?? []).toHaveLength(0);
    expect(def.serviceLayer?.scenario?.faults ?? []).toHaveLength(0);
  });
});
