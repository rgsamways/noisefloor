import type { SeriesPoint } from "../schemas/series.js";
import { createRng } from "./rng.js";

export type ShaperCollapseParams = {
  at: string; // "HH:MM"
  toKbps: number;
  fromKbps?: number; // baseline before the collapse; defaults to a typical residential rate
};

const WINDOW_MINUTES = 60;
const HALF_WINDOW = WINDOW_MINUTES / 2;
const DEFAULT_FROM_KBPS = 30000;

function parseTimeOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h! * 60 + m!;
}

function formatMinuteOfDay(minuteOfDay: number): string {
  const wrapped = ((minuteOfDay % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = Math.floor(wrapped / 60)
    .toString()
    .padStart(2, "0");
  const mm = (wrapped % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

// A one-hour throughput window, centered on `at`, that holds a normal
// baseline until the collapse and a trickle afterward.
export function shaperCollapse(params: ShaperCollapseParams, seed: string | number): SeriesPoint[] {
  const rng = createRng(seed);
  const fromKbps = params.fromKbps ?? DEFAULT_FROM_KBPS;
  const atMinuteOfDay = parseTimeOfDay(params.at);
  const windowStart = atMinuteOfDay - HALF_WINDOW;
  const points: SeriesPoint[] = [];

  for (let i = 0; i < WINDOW_MINUTES; i++) {
    const minuteOfDay = windowStart + i;
    const collapsed = minuteOfDay >= atMinuteOfDay;
    const base = collapsed ? params.toKbps : fromKbps;
    const jitter = collapsed ? rng() * base * 0.05 : (rng() * 2 - 1) * base * 0.1;
    points.push({ t: formatMinuteOfDay(minuteOfDay), v: Math.max(0, Number((base + jitter).toFixed(1))) });
  }

  return points;
}
