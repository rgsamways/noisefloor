import { z } from "zod";
import { SeriesRefSchema, PinglogRefSchema } from "./series.js";

export const DeviceModeSchema = z.enum(["router", "bridge"]);

export const DeviceSchema = z.object({
  model: z.string(),
  mode: DeviceModeSchema,
  firmware: z.string(),
  uptimeHours: z.number().nonnegative(),
  memoryPct: z.number().min(0).max(100),
  cpuPct: z.number().min(0).max(100),
  cableSnrDb: z.number(),
  cableLengthM: z.number().nonnegative(),
  // AP-only in practice (see NOISEFLOOR-OUTLINE.md §7 DeviceDetails), but not
  // enforced structurally — a case author leaves it unset on the CPE side.
  gpsSatellites: z.number().int().nonnegative().optional(),
  // Cosmetic display fields for radio/LinkHeader and radio/DeviceDetails
  // (NOISEFLOOR-OUTLINE.md §7) — no validator rule or rubric depends on
  // these, so they're optional rather than retrofitting every existing
  // World fixture.
  mac: z.string().optional(),
  txPowerDbm: z.number().optional(),
  lanSpeedMbps: z.number().positive().optional(),
});
export type Device = z.infer<typeof DeviceSchema>;

export const CustomerSchema = z.object({
  displayName: z.string(),
  accountRef: z.string(),
  plan: z.object({
    down: z.number().positive(),
    up: z.number().positive(),
  }),
});
export type Customer = z.infer<typeof CustomerSchema>;

export const SiteSchema = z.object({
  apName: z.string(),
  sectorName: z.string(),
  channelMHz: z.number().positive(),
  widthMHz: z.number().positive(),
});
export type Site = z.infer<typeof SiteSchema>;

const ModulationRateSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
]);

export const LinkSchema = z.object({
  distanceM: z.number().positive(),
  signalLocalDbm: z.number(),
  signalRemoteDbm: z.number(),
  chainsLocal: z.tuple([z.number(), z.number()]),
  chainsRemote: z.tuple([z.number(), z.number()]),
  noiseFloorLocalDbm: z.number(),
  noiseFloorRemoteDbm: z.number(),
  cinrLocalDb: z.number(),
  cinrRemoteDb: z.number(),
  rateLocal: ModulationRateSchema,
  rateRemote: ModulationRateSchema,
  capacityDownMbps: z.number().nonnegative(),
  capacityUpMbps: z.number().nonnegative(),
  latencyMs: z.number().nonnegative(),
  linkPotentialPct: z.number().min(0).max(100),
  airtimeTxPct: z.number().min(0).max(100),
  airtimeRxPct: z.number().min(0).max(100),
});
export type Link = z.infer<typeof LinkSchema>;

export const StationRowSchema = z.object({
  mac: z.string(),
  model: z.string(),
  name: z.string(),
  signalDbm: z.number(),
  remoteSignalDbm: z.number(),
  capacityDownMbps: z.number().nonnegative(),
  capacityUpMbps: z.number().nonnegative(),
  airtimeTxPct: z.number().min(0).max(100),
  airtimeRxPct: z.number().min(0).max(100),
  connectionTime: z.string(),
  lastIp: z.string(),
  throughputRxMbps: z.number().nonnegative(),
  throughputTxMbps: z.number().nonnegative(),
  isCurrentCustomer: z.boolean().optional(),
});
export type StationRow = z.infer<typeof StationRowSchema>;

export const WorldEventSchema = z.object({
  at: z.string(),
  label: z.string(),
  actor: z.string().optional(),
});
export type WorldEvent = z.infer<typeof WorldEventSchema>;

export const WorldSeriesSchema = z.object({
  capacityDown24h: SeriesRefSchema,
  usedDown24h: SeriesRefSchema,
  signalTrace24h: SeriesRefSchema,
  capacityDown1y: SeriesRefSchema,
  signalTrace1y: SeriesRefSchema,
  throughputRx1h: SeriesRefSchema,
  // Parallel to throughputRx1h, for nms/DeviceOverview's RX/TX symmetry
  // display (case-001-shaper-incident) — optional since not every case's
  // World needs a transmit-side hourly trace.
  throughputTx1h: SeriesRefSchema.optional(),
  pinglog: PinglogRefSchema,
});
export type WorldSeries = z.infer<typeof WorldSeriesSchema>;

// A short burst of individual ping samples, distinct from any longer-run
// time-series — for crm/RealtimePingModal (case-001-shaper-incident),
// modeling the real "fire off a dozen pings and watch the bars" tool this
// component is based on. `null` marks a dropped packet. avg RTT and loss %
// are computed from `samples` by the component, not stored separately, so
// the displayed stats can't drift from what the bars actually show.
export const RealtimePingSnapshotSchema = z.object({
  targetLabel: z.string(),
  samples: z.array(z.number().nonnegative().nullable()).min(1),
});
export type RealtimePingSnapshot = z.infer<typeof RealtimePingSnapshotSchema>;

// For nms/DeviceManagePane's backups list (case-001-shaper-incident) —
// read-only display; the trainee's actual decision happens through the
// stage's own action prompt, not by interacting with this mock.
export const DeviceBackupSchema = z.object({
  label: z.string(),
  at: z.string(),
});
export type DeviceBackup = z.infer<typeof DeviceBackupSchema>;

export const WorldSchema = z.object({
  customer: CustomerSchema,
  site: SiteSchema,
  cpe: DeviceSchema,
  ap: DeviceSchema,
  link: LinkSchema,
  series: WorldSeriesSchema,
  stationList: z.array(StationRowSchema),
  events: z.array(WorldEventSchema),
  realtimePings: z.array(RealtimePingSnapshotSchema).optional(),
  deviceBackups: z.array(DeviceBackupSchema).optional(),
});
export type World = z.infer<typeof WorldSchema>;
