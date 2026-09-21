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
      // nat omitted
    });
    expect(result.success).toBe(false);
  });
});
