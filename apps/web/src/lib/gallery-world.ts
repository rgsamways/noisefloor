import type { Annotation, World } from "@noisefloor/shared";

// Case-001-shaped World (NOISEFLOOR-OUTLINE.md §9), shared between the
// landing page's hero chart and /dev/gallery. packages/cases has no real
// content yet (Phase 2) — this is a hand-built stand-in, not authored case
// content.
export const galleryWorld: World = {
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
    capacityDown24h: { gen: "noisyCeiling", params: { base: 67, jitter: 12 } },
    usedDown24h: {
      gen: "diurnalUsage",
      params: { peakMbps: 35, peakHour: 22, offHours: [0, 1, 2, 3, 4, 5, 6], noise: 3 },
    },
    signalTrace24h: { gen: "noisyCeiling", params: { base: -69, jitter: 2 } },
    // Inline, not generated: noisyCeiling only produces 24h-shaped, "HH:MM"
    // -labeled points — there's no year-scale ("MM-DD") capacity generator
    // in @noisefloor/shared yet. Adding one is real scope, just not this
    // change's; a dozen roughly-flat monthly points is enough for the
    // gallery/landing chart to render a sensible 1y capacity line.
    capacityDown1y: [
      { t: "01-01", v: 66 }, { t: "02-01", v: 68 }, { t: "03-01", v: 64 }, { t: "04-01", v: 70 },
      { t: "05-01", v: 65 }, { t: "06-01", v: 67 }, { t: "07-01", v: 71 }, { t: "08-01", v: 63 },
      { t: "09-01", v: 69 }, { t: "10-01", v: 66 }, { t: "11-01", v: 68 }, { t: "12-01", v: 65 },
    ],
    signalTrace1y: {
      gen: "foliageYear",
      params: { leafOnDbm: -72, leafOffDbm: -65, leafOnDate: "05-24", leafOffDate: "10-20", growthDbPerYear: 3 },
    },
    throughputRx1h: { gen: "shaperCollapse", params: { at: "11:56", toKbps: 50 } },
    throughputTx1h: { gen: "shaperCollapse", params: { at: "11:56", toKbps: 50 } },
    pinglog: { gen: "pinglogMonth", params: { baseLossPct: 2, eveningSpeckle: 1 } },
  },
  stationList: [
    {
      mac: "00:15:6D:11:22:33",
      model: "PowerBeam-class",
      name: "M. Ferrier",
      signalDbm: -69,
      remoteSignalDbm: -66,
      capacityDownMbps: 66,
      capacityUpMbps: 93,
      airtimeTxPct: 11,
      airtimeRxPct: 9,
      connectionTime: "00:38",
      lastIp: "203.0.113.87",
      throughputRxMbps: 30,
      throughputTxMbps: 6,
      isCurrentCustomer: true,
    },
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
  events: [
    { at: "11:21", label: "UISP reconnect" },
    { at: "11:52", label: "config change on CPE by T1 (shaper)" },
  ],
  realtimePings: [
    { targetLabel: "M. Ferrier", rttMs: 65, lossPct: 1 },
    { targetLabel: "Lakeside Inn", rttMs: 69, lossPct: 3 },
  ],
  deviceBackups: [
    { label: "Pre-maintenance config backup", at: "11:40" },
    { label: "Nightly config backup", at: "02:00" },
  ],
};

export const gallerySeed = "c001-wet-leaves";

export const galleryAnnotations: Annotation[] = [
  // foliageYear steps every 3 days from day-of-year 1, so not every
  // calendar date lands on an actual generated point — "05-25" does
  // (day-of-year 145 = 3*48+1), "05-24" (the leafOnDate parameter itself)
  // doesn't. Same gotcha as gen/foliage-year.test.ts.
  { target: { series: "signalTrace1y", t: "05-25" }, label: "Leaf-out. Signal drops as trees fill in." },
];
