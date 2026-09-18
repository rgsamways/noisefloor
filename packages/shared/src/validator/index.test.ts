import { describe, expect, it } from "vitest";
import { createConsistentWorld } from "./fixtures.js";
import { validateWorld } from "./index.js";

describe("validateWorld", () => {
  it("returns no tensions for a fully consistent World", () => {
    expect(validateWorld(createConsistentWorld(), "test-seed")).toEqual([]);
  });

  // Case 001's headline RF/capacity/shaper values from NOISEFLOOR-OUTLINE.md
  // §9 — scoped to the numbers the validator can actually check today. Not
  // a full reproduction of case 001's five events: reconnect/restore/reboot
  // don't have a modeled series effect yet (that's Phase 2 case-authoring
  // work), so only the shaper-collapse pair (which IS fully modeled via
  // gen/shaper-collapse.ts) is included here. The point of this test is
  // "the validator doesn't hard-fail the project's own canonical case",
  // not "case 001 is fully authored."
  it("returns no hard tensions for case 001's headline values", () => {
    const base = createConsistentWorld();
    const world = createConsistentWorld({
      site: { ...base.site, channelMHz: 5710, widthMHz: 20 },
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
      events: [{ at: "11:52", label: "config change on CPE by T1 (shaper)" }],
      series: {
        ...base.series,
        throughputRx1h: { gen: "shaperCollapse", params: { at: "11:56", toKbps: 50 } },
      },
    });

    const tensions = validateWorld(world, "c001-wet-leaves");
    const hardTensions = tensions.filter((t) => t.severity === "hard");
    expect(hardTensions).toEqual([]);
  });
});
