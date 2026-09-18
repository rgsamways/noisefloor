// Test-only fixtures shared across validator rule tests. Not exported from
// the package — imported directly by .test.ts files via relative path.
import type { World } from "../schemas/world.js";

export function createConsistentWorld(overrides: Partial<World> = {}): World {
  const base: World = {
    customer: { displayName: "M. Ferrier", accountRef: "SYN-00417", plan: { down: 35, up: 10 } },
    site: { apName: "SEC-A", sectorName: "RIDGE-5.8-A", channelMHz: 5710, widthMHz: 20 },
    cpe: {
      model: "PowerBeam-class",
      mode: "router",
      firmware: "8.7.11",
      uptimeHours: 66,
      memoryPct: 40,
      cpuPct: 20,
      cableSnrDb: 27,
      cableLengthM: 28,
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
    },
    link: {
      distanceM: 402,
      signalLocalDbm: -69,
      signalRemoteDbm: -66,
      chainsLocal: [-69, -70],
      chainsRemote: [-66, -67],
      noiseFloorLocalDbm: -91,
      noiseFloorRemoteDbm: -88,
      cinrLocalDb: 22,
      cinrRemoteDb: 22,
      rateLocal: 6,
      rateRemote: 6,
      capacityDownMbps: 65,
      capacityUpMbps: 70,
      latencyMs: 1,
      linkPotentialPct: 52,
      airtimeTxPct: 11,
      airtimeRxPct: 9,
    },
    series: {
      capacityDown24h: [{ t: "00:00", v: 65 }],
      usedDown24h: [{ t: "00:00", v: 10 }],
      signalTrace24h: [{ t: "00:00", v: -69 }],
      capacityDown1y: [{ t: "01-01", v: 65 }],
      signalTrace1y: [{ t: "01-01", v: -69 }],
      throughputRx1h: [{ t: "00:00", v: 30000 }],
      pinglog: { days: 1, bucketMinutes: 60, grid: [["ok"]] },
    },
    stationList: [],
    events: [],
  };

  return { ...base, ...overrides };
}
