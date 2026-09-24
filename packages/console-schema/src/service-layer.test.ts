import { describe, expect, it } from "vitest";
import { ServiceLayerTelemetrySchema } from "./service-layer.js";

const asOf = "2026-09-21T20:00:00Z";
function reading<T>(value: T) {
  return { value, asOf };
}

describe("ServiceLayerTelemetrySchema", () => {
  it("validates a healthy service-layer object independently of any radio-link data", () => {
    const result = ServiceLayerTelemetrySchema.safeParse({
      dhcpLease: {
        present: reading(true),
        issuedAt: reading("2026-09-21T08:00:00Z"),
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
        upstreamPresent: reading(false),
        customerSidePresent: reading(true),
      },
      lanPort: {
        linkUp: reading(true),
        linkSpeedMbps: reading(1000),
        duplex: reading("full"),
        crcErrorCount: reading(0),
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a service-layer object missing a required group", () => {
    const result = ServiceLayerTelemetrySchema.safeParse({
      dhcpLease: {
        present: reading(true),
        issuedAt: reading("2026-09-21T08:00:00Z"),
        remainingSeconds: reading(43_200),
        leaseAddress: reading("10.20.4.17"),
        expectedAddress: reading("10.20.4.17"),
      },
      addressing: {
        managementIp: reading("10.20.4.1"),
        gateway: reading("10.20.4.254"),
        wanAddress: reading("203.0.113.9"),
      },
      lanPort: {
        linkUp: reading(true),
        linkSpeedMbps: reading(1000),
        duplex: reading("full"),
        crcErrorCount: reading(0),
      },
      // nat omitted
    });
    expect(result.success).toBe(false);
  });

  it("validates a lanPort with no active link independently of dhcpLease/addressing/nat validity", () => {
    const result = ServiceLayerTelemetrySchema.safeParse({
      dhcpLease: {
        present: reading(true),
        issuedAt: reading("2026-09-21T08:00:00Z"),
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
        upstreamPresent: reading(false),
        customerSidePresent: reading(true),
      },
      lanPort: {
        linkUp: reading(false),
        linkSpeedMbps: reading(1000),
        duplex: reading("full"),
        crcErrorCount: reading(0),
      },
    });
    expect(result.success).toBe(true);
  });

  it("validates a degraded-but-up LAN port distinct from a fully down one", () => {
    const result = ServiceLayerTelemetrySchema.safeParse({
      dhcpLease: {
        present: reading(true),
        issuedAt: reading("2026-09-21T08:00:00Z"),
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
        upstreamPresent: reading(false),
        customerSidePresent: reading(true),
      },
      lanPort: {
        linkUp: reading(true),
        linkSpeedMbps: reading(100),
        duplex: reading("full"),
        crcErrorCount: reading(480),
      },
    });
    expect(result.success).toBe(true);
  });
});
