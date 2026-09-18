import { resolveSeriesRef } from "../../gen/resolve-series-ref.js";
import type { SeriesPoint } from "../../schemas/series.js";
import type { World, WorldEvent } from "../../schemas/world.js";
import type { Tension } from "../types.js";

// Only the time-of-day-labelled series ("HH:MM" points) are comparable to
// an event's timestamp — the 1-year series use "MM-DD" labels and aren't a
// same-axis comparison for a single dated event.
const TIME_OF_DAY_SERIES_KEYS = ["capacityDown24h", "usedDown24h", "signalTrace24h", "throughputRx1h"] as const;

const RELATIVE_CHANGE_THRESHOLD = 0.15;

function relativeChange(before: number, after: number): number {
  const denominator = Math.max(1, Math.abs(before));
  return Math.abs(after - before) / denominator;
}

// Returns null when the event's timestamp falls outside this series' own
// range — that's a "can't check this series" result, not evidence of no
// effect, so callers should treat it as inconclusive rather than a miss.
//
// Checks the whole remainder of the series after the event, not just the
// next point or two — an event's effect doesn't have to land on the very
// next sample (case 001's shaper change at 11:52 doesn't actually collapse
// throughput until 11:56).
function hasVisibleChangeAt(points: SeriesPoint[], at: string): boolean | null {
  const atOrAfterIndex = points.findIndex((p) => p.t >= at);
  if (atOrAfterIndex <= 0 || atOrAfterIndex >= points.length) return null;

  const before = points[atOrAfterIndex - 1]!.v;
  const after = points.slice(atOrAfterIndex);
  return after.some((p) => relativeChange(before, p.v) > RELATIVE_CHANGE_THRESHOLD);
}

function eventIsReflected(world: World, event: WorldEvent, seed: string | number): boolean | null {
  let checked = false;
  for (const key of TIME_OF_DAY_SERIES_KEYS) {
    const points = resolveSeriesRef(world.series[key], seed);
    const result = hasVisibleChangeAt(points, event.at);
    if (result === null) continue;
    checked = true;
    if (result) return true;
  }
  return checked ? false : null;
}

export function checkEventCoherence(world: World, seed: string | number): Tension[] {
  const tensions: Tension[] = [];

  for (const event of world.events) {
    const reflected = eventIsReflected(world, event, seed);
    if (reflected === false) {
      tensions.push({
        rule: "events.unreflected-in-series",
        severity: "hard",
        fields: [`events[${event.at}]`],
        message: `"${event.label}" at ${event.at} doesn't show up as a change in any time-of-day series. A config change, reboot, or reconnect should leave some visible mark on capacity, usage, signal, or throughput.`,
        resolutions: [
          { description: "Add or adjust a series so this event's effect is visible" },
          { description: "Remove the event if it isn't meant to affect anything observable" },
        ],
      });
    }
    // reflected === null means every comparable series' range missed this
    // event's timestamp — inconclusive, not flagged.
  }

  return tensions;
}
