import { describe, expect, it } from "vitest";
import { RadioLinkTelemetrySchema } from "./radio-link.js";

const asOf = "2026-09-21T20:00:00Z";
function reading<T>(value: T) {
  return { value, asOf };
}

const healthyBaseline = {
  link: {
    signalDbm: reading(-58),
    noiseFloorDbm: reading(-94),
    snrDb: reading(36),
    linkQualityPct: reading(97),
    modulationIndex: reading(7),
    frequencyMhz: reading(5800),
    channelWidthMhz: reading(40),
    linkState: reading("connected" as const),
    chainImbalanceDb: reading(3),
    txPowerDbm: reading(24),
  },
  throughput: {
    txRateMbps: reading(300),
    rxRateMbps: reading(280),
    airtimePct: reading(22),
    channelUtilizationPct: reading(31),
    clientCount: reading(4),
  },
  farEnd: {
    distanceKm: reading(3.1),
    latencyMs: reading(4),
    jitterMs: reading(1),
    packetLossPct: reading(0),
    errorsRetries: reading(0),
  },
  radioHealth: {
    cpuPct: reading(18),
    ramPct: reading(44),
    temperatureC: reading(41),
    uptimeSeconds: reading(1_227_600),
  },
  timeEvidence: {
    lastReboot: reading("2026-09-07T08:00:00Z"),
    lastLogEntry: reading("2026-09-21T19:58:00Z"),
    lastSuccessfulPoll: reading("2026-09-21T20:00:00Z"),
  },
  vendorExtras: {},
};

describe("RadioLinkTelemetrySchema", () => {
  it("accepts a representative healthy-baseline object", () => {
    const result = RadioLinkTelemetrySchema.safeParse(healthyBaseline);
    expect(result.success).toBe(true);
  });

  it("keeps timeEvidence addressable as a sibling of radioHealth, not nested inside it", () => {
    const result = RadioLinkTelemetrySchema.safeParse(healthyBaseline);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.timeEvidence.lastReboot.value).toBe("2026-09-07T08:00:00Z");
    expect(result.data.timeEvidence.lastLogEntry.value).toBe("2026-09-21T19:58:00Z");
    expect(result.data.timeEvidence.lastSuccessfulPoll.value).toBe("2026-09-21T20:00:00Z");
    expect(Object.keys(result.data.radioHealth)).not.toContain("lastReboot");
  });

  it("allows two fields to carry independently different staleness", () => {
    const drifted = {
      ...healthyBaseline,
      link: {
        ...healthyBaseline.link,
        chainImbalanceDb: reading(3),
      },
      farEnd: {
        ...healthyBaseline.farEnd,
        latencyMs: { value: 4, asOf: "2026-09-21T19:50:00Z" },
      },
    };
    const result = RadioLinkTelemetrySchema.safeParse(drifted);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.link.chainImbalanceDb.asOf).toBe("2026-09-21T20:00:00Z");
    expect(result.data.farEnd.latencyMs.asOf).toBe("2026-09-21T19:50:00Z");
  });

  it("accepts an unmapped vendor-specific value in vendorExtras without a core field for it", () => {
    const withExtras = { ...healthyBaseline, vendorExtras: { airmaxQuality: 87 } };
    const result = RadioLinkTelemetrySchema.safeParse(withExtras);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.vendorExtras.airmaxQuality).toBe(87);
  });

  it("rejects a linkState value outside the enum", () => {
    const invalid = {
      ...healthyBaseline,
      link: { ...healthyBaseline.link, linkState: reading("reconnecting") },
    };
    const result = RadioLinkTelemetrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
