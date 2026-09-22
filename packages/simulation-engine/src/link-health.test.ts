import { describe, expect, it } from "vitest";
import { deriveLinkGroup, deriveThroughputGroup, deriveFarEndGroup } from "./link-health.js";
import { linkProfileBaseline } from "./baseline.js";

const noJitterRng = () => 0.5; // jitter(rng, amount) === 0

describe("deriveLinkGroup", () => {
  const profile = { distanceKm: 3, band: "5.8GHz", gearClass: "sector" };
  const baseline = linkProfileBaseline(profile);

  it("produces lower signalDbm and snrDb for a lower linkHealth", () => {
    const healthy = deriveLinkGroup(baseline.linkHealth, baseline, 0, noJitterRng);
    const degraded = deriveLinkGroup(baseline.linkHealth - 0.3, baseline, 0, noJitterRng);

    expect(degraded.signalDbm).toBeLessThan(healthy.signalDbm);
    expect(degraded.snrDb).toBeLessThan(healthy.snrDb);
  });
});

describe("deriveThroughputGroup", () => {
  it("gives a degraded link no higher rate than the healthy baseline", () => {
    const healthyRate = deriveThroughputGroup(0.95, noJitterRng);
    const degradedRate = deriveThroughputGroup(0.3, noJitterRng);
    expect(degradedRate.txRateMbps).toBeLessThanOrEqual(healthyRate.txRateMbps);
    expect(degradedRate.rxRateMbps).toBeLessThanOrEqual(healthyRate.rxRateMbps);
  });
});

describe("deriveFarEndGroup", () => {
  const profile = { distanceKm: 3, band: "5.8GHz", gearClass: "sector" };

  it("gives a degraded link no lower retries than the healthy baseline", () => {
    const healthy = deriveFarEndGroup(0.95, profile, noJitterRng);
    const degraded = deriveFarEndGroup(0.3, profile, noJitterRng);
    expect(degraded.errorsRetries).toBeGreaterThanOrEqual(healthy.errorsRetries);
  });
});
