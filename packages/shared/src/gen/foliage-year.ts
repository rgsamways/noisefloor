import type { SeriesPoint } from "../schemas/series.js";
import { createRng } from "./rng.js";

export type FoliageYearParams = {
  leafOnDbm: number;
  leafOffDbm: number;
  leafOnDate: string; // "MM-DD"
  leafOffDate: string; // "MM-DD"
  growthDbPerYear?: number; // reserved for multi-year projections; unused within one year
};

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const DAY_STEP = 3;
const TRANSITION_DAYS = 5;

function dayOfYear(monthDay: string): number {
  const [month, day] = monthDay.split("-").map(Number);
  let doy = day!;
  for (let m = 0; m < month! - 1; m++) doy += DAYS_IN_MONTH[m]!;
  return doy;
}

function monthDayFromDayOfYear(doy: number): string {
  let remaining = ((doy - 1) % 365) + 1;
  for (let m = 0; m < DAYS_IN_MONTH.length; m++) {
    if (remaining <= DAYS_IN_MONTH[m]!) {
      return `${(m + 1).toString().padStart(2, "0")}-${remaining.toString().padStart(2, "0")}`;
    }
    remaining -= DAYS_IN_MONTH[m]!;
  }
  return "12-31";
}

// Seasonal signal trace: interpolates between leafOffDbm and leafOnDbm
// across a short transition window starting at each configured date.
export function foliageYear(params: FoliageYearParams, seed: string | number): SeriesPoint[] {
  const rng = createRng(seed);
  const leafOnDoy = dayOfYear(params.leafOnDate);
  const leafOffDoy = dayOfYear(params.leafOffDate);
  const points: SeriesPoint[] = [];

  for (let doy = 1; doy <= 365; doy += DAY_STEP) {
    let frac: number; // 0 = leafOff value, 1 = leafOn value
    if (doy < leafOnDoy) {
      frac = 0;
    } else if (doy < leafOnDoy + TRANSITION_DAYS) {
      frac = (doy - leafOnDoy) / TRANSITION_DAYS;
    } else if (doy < leafOffDoy) {
      frac = 1;
    } else if (doy < leafOffDoy + TRANSITION_DAYS) {
      frac = 1 - (doy - leafOffDoy) / TRANSITION_DAYS;
    } else {
      frac = 0;
    }

    const base = params.leafOffDbm + (params.leafOnDbm - params.leafOffDbm) * frac;
    const jitter = (rng() * 2 - 1) * 0.5;
    points.push({ t: monthDayFromDayOfYear(doy), v: Number((base + jitter).toFixed(2)) });
  }

  return points;
}
