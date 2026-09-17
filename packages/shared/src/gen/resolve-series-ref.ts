import type { PinglogGrid, PinglogRef, SeriesPoint, SeriesRef } from "../schemas/series.js";
import { diurnalUsage, type DiurnalUsageParams } from "./diurnal-usage.js";
import { foliageYear, type FoliageYearParams } from "./foliage-year.js";
import { noisyCeiling, type NoisyCeilingParams } from "./noisy-ceiling.js";
import { pinglogMonth, type PinglogMonthParams } from "./pinglog-month.js";
import { shaperCollapse, type ShaperCollapseParams } from "./shaper-collapse.js";

const seriesGenerators = {
  diurnalUsage: (params: DiurnalUsageParams, seed: string | number) => diurnalUsage(params, seed),
  noisyCeiling: (params: NoisyCeilingParams, seed: string | number) => noisyCeiling(params, seed),
  foliageYear: (params: FoliageYearParams, seed: string | number) => foliageYear(params, seed),
  shaperCollapse: (params: ShaperCollapseParams, seed: string | number) => shaperCollapse(params, seed),
} satisfies Record<string, (params: never, seed: string | number) => SeriesPoint[]>;

// Resolves either form of a SeriesRef (inline points or a generator spec)
// into a flat, uniform SeriesPoint[] — a dashboard component never needs to
// know which form the source data took.
export function resolveSeriesRef(ref: SeriesRef, seed: string | number): SeriesPoint[] {
  if (Array.isArray(ref)) return ref;
  const generator = seriesGenerators[ref.gen] as (params: Record<string, unknown>, seed: string | number) => SeriesPoint[];
  return generator(ref.params, seed);
}

// pinglog is grid-shaped, not a flat SeriesPoint[], so it resolves through
// its own function rather than resolveSeriesRef.
export function resolvePinglogRef(ref: PinglogRef, seed: string | number): PinglogGrid {
  if ("grid" in ref) return ref;
  return pinglogMonth(ref.params as PinglogMonthParams, seed);
}
