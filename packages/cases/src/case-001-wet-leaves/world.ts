import type { World } from "@noisefloor/shared";

// Case 001's World — headline values from NOISEFLOOR-OUTLINE.md §9. Covers
// both the foliage arc (stages 1-5) and the shaper-collapse incident
// (stages 6-10) — see openspec/changes/case-001-shaper-incident/design.md
// for why `events` has only two entries rather than outline §9's full
// five: the other three (11:21 reconnect, 12:34 restore, 12:35 reboot)
// fall outside `shaperCollapse`'s one-hour window and have no real,
// non-fabricated series effect to check — they're conveyed as narrative
// evidence in stages 6/9/10 instead of formal WorldEvents.
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
    // Real shaper-collapse subplot (outline §9): a normal ~30 Mbps baseline
    // until 11:56, then a trickle. throughputTx1h uses the same params
    // deliberately — RX and TX collapsing to the same value at the same
    // time is the "symmetric traffic = management chatter, not a real
    // session" tell stage 8's rubric hinges on.
    throughputRx1h: { gen: "shaperCollapse", params: { at: "11:56", toKbps: 50 } },
    throughputTx1h: { gen: "shaperCollapse", params: { at: "11:56", toKbps: 50 } },
    pinglog: { gen: "pinglogMonth", params: { baseLossPct: 1 } },
  },
  stationList: [
    {
      // Post-fix values (stage 10's "It's back." reveal) — this World is a
      // single static snapshot, and only stage 10 reveals this component,
      // so it always reflects the resolved state, not the mid-incident one.
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
  // Only the two events with a real, checkable effect in throughputRx1h/
  // throughputTx1h — see the module comment above.
  events: [
    { at: "11:52", label: "Config change on CPE by T1 (shaper)", actor: "T1" },
    { at: "11:56", label: "Throughput collapse" },
  ],
  // Stage 7's "ping looks fine" red herring (NOISEFLOOR-OUTLINE.md §9) —
  // ICMP passes through a starved shaper; ping is not a throughput test.
  realtimePings: [
    {
      targetLabel: "M. Ferrier",
      samples: [64, 66, 63, 65, 67, 64, 65, 66, 63, 65, null, 64, 66, 65, 64, 67, 63, 65, 66, 64],
    },
    {
      targetLabel: "Lakeside Inn",
      samples: [68, 70, 69, 71, 68, null, 70, 69, 68, 71, 69, 70, 68, 69, null, 70, 69, 71, 68, 69],
    },
  ],
  // Stage 9's collapsed Backups section — a pre-incident backup exists to
  // restore, which is one of the correct actions for that stage's rubric.
  deviceBackups: [
    { label: "Pre-maintenance config backup", at: "11:40" },
    { label: "Nightly config backup", at: "02:00" },
  ],
};
