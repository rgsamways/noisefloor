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
  pinglog: PinglogRefSchema,
});
export type WorldSeries = z.infer<typeof WorldSeriesSchema>;

export const WorldSchema = z.object({
  customer: CustomerSchema,
  site: SiteSchema,
  cpe: DeviceSchema,
  ap: DeviceSchema,
  link: LinkSchema,
  series: WorldSeriesSchema,
  stationList: z.array(StationRowSchema),
  events: z.array(WorldEventSchema),
});
export type World = z.infer<typeof WorldSchema>;
