import { resolveSeriesRef } from "../../gen/resolve-series-ref.js";
import type { World } from "../../schemas/world.js";
import { SHAPER_SUSPICIOUSLY_LOW_MBPS } from "../constants.js";
import type { Tension } from "../types.js";

// How many consecutive post-event points must stay low before we call it a
// sustained plateau rather than a one-sample dip.
const PLATEAU_WINDOW = 5;

function isShaperEvent(label: string): boolean {
  return /shaper/i.test(label);
}

// throughputRx1h values are in kbit/s by project convention (see
// gen/shaper-collapse.ts) — deliberately different from the Mbit/s used by
// capacityDown24h/usedDown24h, matching the real "shaper-units-kbps"
// gotcha this check exists to catch.
export function checkShaperThroughput(world: World, seed: string | number): Tension[] {
  const shaperEvents = world.events.filter((event) => isShaperEvent(event.label));
  if (shaperEvents.length === 0) return [];

  const points = resolveSeriesRef(world.series.throughputRx1h, seed);
  if (points.length === 0) return [];

  const tensions: Tension[] = [];
  for (const event of shaperEvents) {
    // Look at the tail of the post-event window (where a collapse has had
    // time to settle), not the points immediately following the event —
    // case 001's shaper change at 11:52 doesn't actually collapse
    // throughput until 11:56.
    const after = points.filter((p) => p.t > event.at).slice(-PLATEAU_WINDOW);
    if (after.length < PLATEAU_WINDOW) continue;

    const plateauKbps = Math.max(...after.map((p) => p.v));
    const plateauMbps = plateauKbps / 1000;
    if (plateauMbps < SHAPER_SUSPICIOUSLY_LOW_MBPS) {
      tensions.push({
        rule: "shaper.suspiciously-low-post-event-throughput",
        severity: "soft",
        fields: ["series.throughputRx1h", `events[${event.at}]`],
        message: `Throughput settles at about ${plateauKbps.toFixed(0)} kbit/s after "${event.label}" — if this was meant to be ${(plateauKbps / 1000).toFixed(2)} Mbit/s times 1000, someone typed kbit/s where the field wanted Mbit/s (or vice versa). Worth a second look.`,
        resolutions: [{ description: "Confirm the intended unit for this shaper change" }],
      });
    }
  }

  return tensions;
}
