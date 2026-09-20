import type { World } from "@noisefloor/shared";

// Case 001's World — headline values from NOISEFLOOR-OUTLINE.md §9.
//
// Scoped for this minimal-playable slice (stages 1/4/5, the foliage arc
// only — see openspec/changes/case-engine-minimal-playable/design.md):
// `events` is empty and `throughputRx1h` holds a steady, uneventful series
// rather than the real case's shaper-collapse subplot. That subplot needs
// its own WorldEvents (config change, reconnect, restore, reboot), and
// world-validator's event-coherence rule requires every event to have a
// visible series effect — three of those five events (reconnect/restore/
// reboot) don't have one modeled yet. Authoring them now, without stages
// 6-10 to use them, would either fail validation honestly or need a fake
// placeholder effect. Add them together with those stages in a later phase.
export const world: World = {
  customer: { displayName: "M. Ferrier", accountRef: "SYN-00417", plan: { down: 35, up: 10 } },
  site: { apName: "SEC-A", sectorName: "RIDGE-5.8-A", channelMHz: 5710, widthMHz: 20 },
  cpe: {
    model: "PowerBeam-class",
    mode: "router",
    firmware: "8.7.11",
    uptimeHours: 66,
    memoryPct: 78,
    cpuPct: 20,
    cableSnrDb: 27,
    cableLengthM: 28,
    mac: "00:15:6D:11:22:33",
    txPowerDbm: 24,
    lanSpeedMbps: 1000,
  },
  ap: {
    model: "Sector",
    mode: "bridge",
    firmware: "8.7.11",
    uptimeHours: 720,
    memoryPct: 40,
    cpuPct: 15,
    cableSnrDb: 30,
    cableLengthM: 12,
    gpsSatellites: 9,
    mac: "00:15:6D:44:55:66",
    txPowerDbm: 27,
    lanSpeedMbps: 1000,
  },
  link: {
    distanceM: 402,
    signalLocalDbm: -69,
    signalRemoteDbm: -66,
    chainsLocal: [-69, -74],
    chainsRemote: [-66, -72],
    noiseFloorLocalDbm: -104,
    noiseFloorRemoteDbm: -91,
    cinrLocalDb: 23,
    cinrRemoteDb: 21,
    rateLocal: 6,
    rateRemote: 6,
    capacityDownMbps: 66,
    capacityUpMbps: 93,
    latencyMs: 1,
    linkPotentialPct: 52,
    airtimeTxPct: 11,
    airtimeRxPct: 9,
  },
  series: {
    capacityDown24h: { gen: "noisyCeiling", params: { base: 67, jitter: 13 } },
    usedDown24h: {
      gen: "diurnalUsage",
      params: { peakMbps: 35, peakHour: 22, offHours: [0, 1, 2, 3, 4, 5, 6], noise: 3 },
    },
    signalTrace24h: { gen: "noisyCeiling", params: { base: -69, jitter: 2 } },
    // Inline, not generated — see the same note in apps/web/src/lib/gallery-world.ts:
    // there's no year-scale ("MM-DD"-labelled) capacity generator yet.
    capacityDown1y: [
      { t: "01-01", v: 66 }, { t: "02-01", v: 68 }, { t: "03-01", v: 64 }, { t: "04-01", v: 70 },
      { t: "05-01", v: 65 }, { t: "06-01", v: 67 }, { t: "07-01", v: 71 }, { t: "08-01", v: 63 },
      { t: "09-01", v: 69 }, { t: "10-01", v: 66 }, { t: "11-01", v: 68 }, { t: "12-01", v: 65 },
    ],
    signalTrace1y: {
      gen: "foliageYear",
      params: { leafOnDbm: -72, leafOffDbm: -65, leafOnDate: "05-24", leafOffDate: "10-20", growthDbPerYear: 3 },
    },
    // Steady/uneventful in this slice — see the module comment above.
    throughputRx1h: { gen: "noisyCeiling", params: { base: 30000, jitter: 2000 } },
    pinglog: { gen: "pinglogMonth", params: { baseLossPct: 1 } },
  },
  stationList: [
    {
      mac: "00:15:6D:AA:BB:CC",
      model: "NanoStation-class",
      name: "Lakeside Inn",
      signalDbm: -51,
      remoteSignalDbm: -53,
      capacityDownMbps: 140,
      capacityUpMbps: 148,
      airtimeTxPct: 1.8,
      airtimeRxPct: 1.2,
      connectionTime: "14:22:10",
      lastIp: "203.0.113.42",
      throughputRxMbps: 4.2,
      throughputTxMbps: 1.1,
    },
  ],
  events: [],
};
