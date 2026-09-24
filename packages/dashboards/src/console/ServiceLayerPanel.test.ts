import { describe, expect, it } from "vitest";
import type { ServiceLayerTelemetry } from "@noisefloor/console-schema";
import { serviceLayerSeverity } from "./ServiceLayerPanel.js";

const asOf = "2026-09-24T00:00:00Z";
function reading<T>(value: T) {
  return { value, asOf };
}

function telemetry(overrides: Partial<{
  linkUp: boolean;
  linkSpeedMbps: number;
  crcErrorCount: number;
  dhcpPresent: boolean;
  natUpstream: boolean;
  natCustomerSide: boolean;
}> = {}): ServiceLayerTelemetry {
  return {
    dhcpLease: {
      present: reading(overrides.dhcpPresent ?? true),
      issuedAt: reading("2026-09-24T00:00:00Z"),
      remainingSeconds: reading(43_200),
      leaseAddress: reading("10.20.4.17"),
      expectedAddress: reading("10.20.4.17"),
    },
    addressing: {
      managementIp: reading("10.20.4.1"),
      gateway: reading("10.20.4.254"),
      wanAddress: reading("203.0.113.9"),
    },
    nat: {
      upstreamPresent: reading(overrides.natUpstream ?? false),
      customerSidePresent: reading(overrides.natCustomerSide ?? true),
    },
    lanPort: {
      linkUp: reading(overrides.linkUp ?? true),
      linkSpeedMbps: reading(overrides.linkSpeedMbps ?? 1000),
      duplex: reading("full"),
      crcErrorCount: reading(overrides.crcErrorCount ?? 0),
    },
  };
}

describe("serviceLayerSeverity", () => {
  it("is good for a fully healthy service layer", () => {
    expect(serviceLayerSeverity(telemetry())).toBe("good");
  });

  it("is warn for a degraded-but-up LAN port (reduced speed, CRC errors)", () => {
    expect(serviceLayerSeverity(telemetry({ linkSpeedMbps: 100, crcErrorCount: 480 }))).toBe("warn");
  });

  it("is bad for a fully down LAN port", () => {
    expect(serviceLayerSeverity(telemetry({ linkUp: false }))).toBe("bad");
  });

  it("is bad for an expired lease", () => {
    expect(serviceLayerSeverity(telemetry({ dhcpPresent: false }))).toBe("bad");
  });

  it("is warn for double NAT", () => {
    expect(serviceLayerSeverity(telemetry({ natUpstream: true, natCustomerSide: true }))).toBe("warn");
  });
});
