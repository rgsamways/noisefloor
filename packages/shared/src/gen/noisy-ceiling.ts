import type { SeriesPoint } from "../schemas/series.js";
import { createRng } from "./rng.js";

export type NoisyCeilingSpike = { at: number; delta: number };

export type NoisyCeilingParams = {
  base: number;
  jitter: number;
  spikes?: NoisyCeilingSpike[];
};

const POINTS_PER_DAY = 96; // one every 15 minutes

function formatTimeOfDay(hourFraction: number): string {
  const hh = Math.floor(hourFraction).toString().padStart(2, "0");
  const mm = Math.round((hourFraction % 1) * 60)
    .toString()
    .padStart(2, "0");
  return `${hh}:${mm}`;
}

// A capacity ceiling that bounces within base +/- jitter, with optional
// one-off spikes at specific point indices.
export function noisyCeiling(params: NoisyCeilingParams, seed: string | number): SeriesPoint[] {
  const rng = createRng(seed);
  const spikeByIndex = new Map((params.spikes ?? []).map((s) => [s.at, s.delta]));
  const points: SeriesPoint[] = [];

  for (let i = 0; i < POINTS_PER_DAY; i++) {
    const hour = (i * 24) / POINTS_PER_DAY;
    const spikeDelta = spikeByIndex.get(i) ?? 0;
    const value = params.base + (rng() * 2 - 1) * params.jitter + spikeDelta;
    points.push({ t: formatTimeOfDay(hour), v: Number(value.toFixed(2)) });
  }

  return points;
}
