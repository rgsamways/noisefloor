import { z } from "zod";
import { readingSchema } from "./reading.js";

// Field groups mirror docs/NOISEFLOOR-CONSOLE-HANDOFF.md §4 exactly, plus
// §4a's time-evidence group kept as its own sibling rather than folded
// into radioHealth — vendor screens bury reboot/log/poll timestamps inside
// health/status panels, which is precisely the habit §4a asks the console
// not to inherit.

export const LinkGroupSchema = z.object({
  signalDbm: readingSchema(z.number()),
  noiseFloorDbm: readingSchema(z.number()),
  // Some vendors (Cambium ePMP/PMP450) don't report SNR directly — it's
  // derived elsewhere (simulation engine now, a real normalizer in phase
  // two). This schema only names the field; see design.md Non-Goals.
  snrDb: readingSchema(z.number()),
  // Approximate on purpose: conflates Ubiquiti CCQ and Cambium link
  // efficiency into one generically-named field rather than pretending
  // they're a clean 1:1 mapping (handoff §4).
  linkQualityPct: readingSchema(z.number().min(0).max(100)),
  modulationIndex: readingSchema(z.number()),
  frequencyMhz: readingSchema(z.number()),
  channelWidthMhz: readingSchema(z.number()),
  linkState: readingSchema(z.enum(["connected", "associating", "down"])),
  // Per-antenna chain difference. Catches a bad cable or wet connector
  // immediately (handoff §4) — derived from a signal/signal2 pair on real
  // gear (see design.md's Meridian cross-reference), not computed here.
  chainImbalanceDb: readingSchema(z.number()),
  txPowerDbm: readingSchema(z.number()),
});
export type LinkGroup = z.infer<typeof LinkGroupSchema>;

export const ThroughputGroupSchema = z.object({
  txRateMbps: readingSchema(z.number()),
  rxRateMbps: readingSchema(z.number()),
  // The field that explains capacity — great signal plus saturated
  // airtime is still slow (handoff §4).
  airtimePct: readingSchema(z.number().min(0).max(100)),
  channelUtilizationPct: readingSchema(z.number().min(0).max(100)),
  clientCount: readingSchema(z.number().int().nonnegative()),
});
export type ThroughputGroup = z.infer<typeof ThroughputGroupSchema>;

export const FarEndGroupSchema = z.object({
  distanceKm: readingSchema(z.number()),
  latencyMs: readingSchema(z.number()),
  jitterMs: readingSchema(z.number()),
  // Distinct from errorsRetries — loss doesn't recover, retries do
  // (handoff §4).
  packetLossPct: readingSchema(z.number().min(0).max(100)),
  errorsRetries: readingSchema(z.number().int().nonnegative()),
});
export type FarEndGroup = z.infer<typeof FarEndGroupSchema>;

export const RadioHealthGroupSchema = z.object({
  cpuPct: readingSchema(z.number().min(0).max(100)),
  ramPct: readingSchema(z.number().min(0).max(100)),
  temperatureC: readingSchema(z.number()),
  // Raw seconds, not a formatted duration — matches Meridian's
  // hardware-confirmed `uptime` field (design.md). Formatting is a UI
  // concern, not a schema one.
  uptimeSeconds: readingSchema(z.number().nonnegative()),
});
export type RadioHealthGroup = z.infer<typeof RadioHealthGroupSchema>;

export const TimeEvidenceGroupSchema = z.object({
  // Each value is itself an ISO timestamp of when the event happened;
  // `asOf` (from readingSchema) is when this reading was last fetched —
  // the two are independent per handoff §4b.
  lastReboot: readingSchema(z.iso.datetime()),
  lastLogEntry: readingSchema(z.iso.datetime()),
  lastSuccessfulPoll: readingSchema(z.iso.datetime()),
});
export type TimeEvidenceGroup = z.infer<typeof TimeEvidenceGroupSchema>;

export const RadioLinkTelemetrySchema = z.object({
  link: LinkGroupSchema,
  throughput: ThroughputGroupSchema,
  farEnd: FarEndGroupSchema,
  radioHealth: RadioHealthGroupSchema,
  timeEvidence: TimeEvidenceGroupSchema,
  // Escape hatch for anything vendor-specific that doesn't map to a core
  // field (airMAX quality, Tarana per-subscriber capacity, etc.) — a
  // future vendor driver never has to force a real reading into a field
  // that doesn't fit it (handoff §4, closing line).
  vendorExtras: z.record(z.string(), z.unknown()),
});
export type RadioLinkTelemetry = z.infer<typeof RadioLinkTelemetrySchema>;
