import type { SeriesPoint } from "../schemas/series.js";
import { createRng } from "./rng.js";

export type DiurnalUsageParams = {
  peakMbps: number;
  peakHour: number; // 0-23
  offHours: number[]; // hours where usage drops near zero
  noise: number; // max +/- jitter around the shape
};

const POINTS_PER_DAY = 96; // one every 15 minutes

function formatTimeOfDay(hourFraction: number): string {
  const hh = Math.floor(hourFraction).toString().padStart(2, "0");
  const mm = Math.round((hourFraction % 1) * 60)
    .toString()
    .padStart(2, "0");
  return `${hh}:${mm}`;
}

// Residential download pattern: a gaussian-ish bump centered on peakHour,
// suppressed during offHours, jittered by a seeded RNG so the same case
// always draws the same 24h curve.
export function diurnalUsage(params: DiurnalUsageParams, seed: string | number): SeriesPoint[] {
  const rng = createRng(seed);
  const points: SeriesPoint[] = [];

  for (let i = 0; i < POINTS_PER_DAY; i++) {
    const hour = (i * 24) / POINTS_PER_DAY;
    const hourInt = Math.floor(hour);

    let value: number;
    if (params.offHours.includes(hourInt)) {
      value = rng() * params.noise * 0.2;
    } else {
      let delta = Math.abs(hour - params.peakHour);
      delta = Math.min(delta, 24 - delta); // wrap around midnight
      const shape = Math.exp(-(delta * delta) / (2 * 3 * 3)); // ~3h wide bump
      value = params.peakMbps * shape + (rng() * 2 - 1) * params.noise;
    }

    points.push({ t: formatTimeOfDay(hour), v: Math.max(0, Number(value.toFixed(2))) });
  }

  return points;
}
