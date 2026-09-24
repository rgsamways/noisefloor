import { describe, expect, it } from "vitest";
import { deriveLinkGroup, deriveThroughputGroup, deriveFarEndGroup } from "./link-health.js";
import { linkProfileBaseline } from "./baseline.js";

const noJitterRng = () => 0.5; // jitter(rng, amount) === 0

describe("deriveLinkGroup", () => {
  const profile = { distanceKm: 3, band: "5.8GHz", gearClass: "sector" };
  const baseline = linkProfileBaseline(profile);

  it("produces lower signalDbm and snrDb for a lower linkHealth, without moving noiseFloorDbm", () => {
    const healthy = deriveLinkGroup(baseline.linkHealth, baseline, 0, noJitterRng);
    const degraded = deriveLinkGroup(baseline.linkHealth - 0.3, baseline, 0, noJitterRng);

    expect(degraded.signalDbm).toBeLessThan(healthy.signalDbm);
    expect(degraded.snrDb).toBeLessThan(healthy.snrDb);
    expect(degraded.noiseFloorDbm).toBe(healthy.noiseFloorDbm);
  });

  it("moves noiseFloorDbm independently of signal when given a noiseFloorDeltaDb", () => {
    const healthy = deriveLinkGroup(baseline.linkHealth, baseline, 0, noJitterRng, 0);
    const noisy = deriveLinkGroup(baseline.linkHealth, baseline, 0, noJitterRng, 15);

    expect(noisy.noiseFloorDbm).toBeGreaterThan(healthy.noiseFloorDbm);
    expect(noisy.signalDbm).toBe(healthy.signalDbm);
    expect(noisy.snrDb).toBeLessThan(healthy.snrDb);
  });

  it("leaves linkQualityPct/modulationIndex unchanged from the health-only formula when noiseFloorDeltaDb is 0", () => {
    const degradedHealth = baseline.linkHealth - 0.3;
    const withDefaultParam = deriveLinkGroup(degradedHealth, baseline, 0, noJitterRng);
    const withExplicitZero = deriveLinkGroup(degradedHealth, baseline, 0, noJitterRng, 0);

    expect(withDefaultParam.linkQualityPct).toBe(withExplicitZero.linkQualityPct);
    expect(withDefaultParam.modulationIndex).toBe(withExplicitZero.modulationIndex);
    expect(withDefaultParam.linkQualityPct).toBe(Math.round(degradedHealth * 100));
  });

  it("degrades linkQualityPct/modulationIndex from signal loss alone, with noise floor unchanged", () => {
    const healthy = deriveLinkGroup(baseline.linkHealth, baseline, 0, noJitterRng, 0);
    const degraded = deriveLinkGroup(baseline.linkHealth - 0.3, baseline, 0, noJitterRng, 0);

    expect(degraded.noiseFloorDbm).toBe(healthy.noiseFloorDbm);
    expect(degraded.linkQualityPct).toBeLessThan(healthy.linkQualityPct);
    expect(degraded.modulationIndex).toBeLessThan(healthy.modulationIndex);
  });

  it("degrades linkQualityPct/modulationIndex from noise alone, with signal unchanged", () => {
    const healthy = deriveLinkGroup(baseline.linkHealth, baseline, 0, noJitterRng, 0);
    const noisy = deriveLinkGroup(baseline.linkHealth, baseline, 0, noJitterRng, 15);

    expect(noisy.signalDbm).toBe(healthy.signalDbm);
    expect(noisy.linkQualityPct).toBeLessThan(healthy.linkQualityPct);
    expect(noisy.modulationIndex).toBeLessThan(healthy.modulationIndex);
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
