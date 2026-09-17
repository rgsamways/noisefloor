import type { PinglogCellValue, PinglogGrid } from "../schemas/series.js";
import { createRng } from "./rng.js";

export type PinglogOutage = {
  start: string; // "YYYY-MM-DDTHH:MM" — only the day-of-month and time-of-day are used
  minutes: number;
};

export type PinglogMonthParams = {
  baseLossPct: number;
  outages?: PinglogOutage[];
  eveningSpeckle?: number; // extra slow/loss probability (percentage points) during 18:00-23:59
  days?: number; // default 30
  bucketMinutes?: number; // default 10
};

const DEFAULT_DAYS = 30;
const DEFAULT_BUCKET_MINUTES = 10;

function parseOutageStart(start: string): { dayOfMonth: number; minuteOfDay: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(start);
  if (!match) throw new Error(`pinglogMonth: invalid outage start "${start}", expected YYYY-MM-DDTHH:MM`);
  const dayOfMonth = Number(match[3]) - 1; // 0-indexed day-of-month, used as a grid row index
  const minuteOfDay = Number(match[4]) * 60 + Number(match[5]);
  return { dayOfMonth, minuteOfDay };
}

// A day x minute-bucket grid of ok/slow/loss cells: a baseline loss rate
// with evening speckle, plus hard "loss" stamped over each configured
// outage window.
export function pinglogMonth(params: PinglogMonthParams, seed: string | number): PinglogGrid {
  const rng = createRng(seed);
  const days = params.days ?? DEFAULT_DAYS;
  const bucketMinutes = params.bucketMinutes ?? DEFAULT_BUCKET_MINUTES;
  const bucketsPerDay = Math.floor((24 * 60) / bucketMinutes);

  const grid: PinglogCellValue[][] = [];
  for (let day = 0; day < days; day++) {
    const row: PinglogCellValue[] = [];
    for (let bucket = 0; bucket < bucketsPerDay; bucket++) {
      const hour = (bucket * bucketMinutes) / 60;
      const isEvening = hour >= 18 && hour < 24;
      const speckle = isEvening ? (params.eveningSpeckle ?? 0) : 0;
      const roll = rng() * 100;
      const value: PinglogCellValue = roll < params.baseLossPct + speckle ? (rng() < 0.3 ? "loss" : "slow") : "ok";
      row.push(value);
    }
    grid.push(row);
  }

  for (const outage of params.outages ?? []) {
    const { dayOfMonth, minuteOfDay } = parseOutageStart(outage.start);
    if (dayOfMonth < 0 || dayOfMonth >= days) continue;
    const bucketStart = Math.floor(minuteOfDay / bucketMinutes);
    const bucketCount = Math.ceil(outage.minutes / bucketMinutes);
    const row = grid[dayOfMonth]!;
    for (let b = bucketStart; b < Math.min(bucketStart + bucketCount, row.length); b++) {
      row[b] = "loss";
    }
  }

  return { days, bucketMinutes, grid };
}
