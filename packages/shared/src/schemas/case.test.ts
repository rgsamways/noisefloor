import { describe, expect, it } from "vitest";
import { CaseSchema } from "./case.js";
import type { World } from "./world.js";

const minimalWorld: World = {
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
    capacityDown24h: [{ t: "00:00", v: 60 }],
    usedDown24h: [{ t: "00:00", v: 10 }],
    signalTrace24h: [{ t: "00:00", v: -69 }],
    capacityDown1y: [{ t: "01-01", v: 60 }],
    signalTrace1y: [{ t: "01-01", v: -69 }],
    throughputRx1h: [{ t: "00:00", v: 30000 }],
    pinglog: { days: 1, bucketMinutes: 60, grid: [["ok"]] },
  },
  stationList: [],
  events: [],
};

function minimalCase(overrides: Record<string, unknown> = {}) {
  return {
    id: "c001-wet-leaves",
    slug: "wet-leaves",
    title: "It's slow when it rains",
    version: 1,
    difficulty: 2 as const,
    estimatedMinutes: 25,
    tags: ["foliage"],
    gotchas: ["seasonal-signal-is-trees"],
    world: minimalWorld,
    opening: { ticketText: "Customer reports slow speeds when it rains.", evidence: [] },
    stages: [
      {
        id: "s1",
        title: "What does this graph tell you about capacity?",
        reveal: [{ kind: "dashboard", family: "crm", view: "LinkCapacityChart" }],
        prompt: {
          kind: "hypothesis",
          options: [{ id: "a", label: "The link is capacity-capped" }],
          allowFreeText: true,
        },
        rubric: {
          kind: "options",
          scores: [{ optionId: "a", score: 2, feedback: "Reasonable, but not the whole picture yet." }],
        },
        feedback: { text: "Good start — keep watching the ceiling." },
      },
    ],
    debrief: { narrative: "It was foliage all along.", annotatedReplays: [], gotchaIds: ["seasonal-signal-is-trees"] },
    ...overrides,
  };
}

describe("CaseSchema", () => {
  it("accepts a well-formed case", () => {
    const result = CaseSchema.safeParse(minimalCase());
    expect(result.success).toBe(true);
  });

  it("rejects a case missing world", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured only to drop `world` from `rest`
    const { world, ...rest } = minimalCase();
    const result = CaseSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a case with zero stages", () => {
    const result = CaseSchema.safeParse(minimalCase({ stages: [] }));
    expect(result.success).toBe(false);
  });

  it("defaults author to curated and visibility to public", () => {
    const result = CaseSchema.parse(minimalCase());
    expect(result.author).toEqual({ kind: "curated" });
    expect(result.visibility).toBe("public");
  });

  it("accepts an explicit user-authored, private case", () => {
    const result = CaseSchema.safeParse(
      minimalCase({ author: { kind: "user", userId: "u_123" }, visibility: "private" }),
    );
    expect(result.success).toBe(true);
  });

  it("accepts a findTheFault stage referencing validator rule ids", () => {
    const result = CaseSchema.safeParse(
      minimalCase({
        stages: [
          {
            id: "s1",
            title: "What in this case doesn't hold together?",
            reveal: [{ kind: "dashboard", family: "radio", view: "SignalPanel" }],
            prompt: { kind: "findTheFault", freeText: true },
            rubric: { kind: "findTheFault", tensionRuleIds: ["snr.rate-exceeds-cinr"] },
            feedback: { text: "The modulation rate this link claims isn't supportable at this CINR." },
          },
        ],
      }),
    );
    expect(result.success).toBe(true);
  });
});
