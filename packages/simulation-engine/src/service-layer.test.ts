import { describe, expect, it } from "vitest";
import { ServiceLayerTelemetrySchema } from "@noisefloor/console-schema";
import {
  simulateServiceLayer,
  expiredLeaseFault,
  doubleNatFault,
  customerRouterOfflineFault,
  type ServiceLayerConfig,
} from "./service-layer.js";

const baseTimeIso = "2026-09-21T00:00:00.000Z";

function config(overrides: Partial<ServiceLayerConfig> = {}): ServiceLayerConfig {
  return { baseTimeIso, ...overrides };
}

describe("simulateServiceLayer — healthy baseline", () => {
  it("produces a fully valid ServiceLayerTelemetry with no active fault", () => {
    const snapshot = simulateServiceLayer(config(), 1000);
    const result = ServiceLayerTelemetrySchema.safeParse(snapshot);
    expect(result.success).toBe(true);
  });

  it("has exactly one NAT layer present", () => {
    const snapshot = simulateServiceLayer(config(), 0);
    const upstream = snapshot.nat.upstreamPresent.value;
    const customerSide = snapshot.nat.customerSidePresent.value;
    expect(upstream !== customerSide).toBe(true);
  });

  it("does not require a linkHealth or radio-link scalar as input", () => {
    // Type-level: ServiceLayerConfig has no linkHealth/linkProfile field at
    // all — this is a runtime smoke test that the function still resolves
    // to a full snapshot without one.
    const snapshot = simulateServiceLayer({ baseTimeIso }, 0);
    expect(snapshot.dhcpLease.present.value).toBe(true);
  });

  it("counts remainingSeconds down and resets across a renewal boundary", () => {
    const early = simulateServiceLayer(config(), 100);
    const late = simulateServiceLayer(config(), 80_000);
    const justAfterRenewal = simulateServiceLayer(config(), 86_500);

    expect(late.dhcpLease.remainingSeconds.value).toBeLessThan(early.dhcpLease.remainingSeconds.value);
    expect(justAfterRenewal.dhcpLease.remainingSeconds.value).toBeGreaterThan(late.dhcpLease.remainingSeconds.value);
  });
});

describe("simulateServiceLayer — discrete fault mechanism", () => {
  it("has no override effect before triggerAtSec, and applies it at/after", () => {
    const scenario = { faults: [expiredLeaseFault(500)] };
    const before = simulateServiceLayer(config({ scenario }), 100);
    const atTrigger = simulateServiceLayer(config({ scenario }), 500);

    expect(before.dhcpLease.present.value).toBe(true);
    expect(atTrigger.dhcpLease.present.value).toBe(false);
  });

  it("resolves overlapping fields to the later-triggered fault", () => {
    const early = { triggerAtSec: 100, overrides: { natCustomerSidePresent: false } };
    const late = { triggerAtSec: 200, overrides: { natCustomerSidePresent: true } };
    const scenario = { faults: [early, late] };

    const snapshot = simulateServiceLayer(config({ scenario }), 300);
    expect(snapshot.nat.customerSidePresent.value).toBe(true);
  });
});

describe("simulateServiceLayer — expired lease", () => {
  it("shows no valid lease and a self-assigned address distinct from expectedAddress", () => {
    const scenario = { faults: [expiredLeaseFault(0)] };
    const snapshot = simulateServiceLayer(config({ scenario }), 10);

    expect(snapshot.dhcpLease.present.value).toBe(false);
    expect(snapshot.dhcpLease.leaseAddress.value).not.toBe(snapshot.dhcpLease.expectedAddress.value);
  });
});

describe("simulateServiceLayer — double NAT", () => {
  it("shows both NAT layers present simultaneously", () => {
    const scenario = { faults: [doubleNatFault(0)] };
    const snapshot = simulateServiceLayer(config({ scenario }), 10);

    expect(snapshot.nat.upstreamPresent.value).toBe(true);
    expect(snapshot.nat.customerSidePresent.value).toBe(true);
  });
});

describe("simulateServiceLayer — customer router offline", () => {
  it("drops the LAN link and nothing else", () => {
    const healthy = simulateServiceLayer(config(), 10);
    const scenario = { faults: [customerRouterOfflineFault(0)] };
    const snapshot = simulateServiceLayer(config({ scenario }), 10);

    expect(snapshot.lanPort.linkUp.value).toBe(false);
    expect(snapshot.dhcpLease.present.value).toBe(healthy.dhcpLease.present.value);
    expect(snapshot.dhcpLease.leaseAddress.value).toBe(healthy.dhcpLease.leaseAddress.value);
    expect(snapshot.addressing.wanAddress.value).toBe(healthy.addressing.wanAddress.value);
    expect(snapshot.nat.upstreamPresent.value).toBe(healthy.nat.upstreamPresent.value);
    expect(snapshot.nat.customerSidePresent.value).toBe(healthy.nat.customerSidePresent.value);
  });
});
