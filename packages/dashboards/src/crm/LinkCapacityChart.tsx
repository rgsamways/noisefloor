import type { Annotation, World } from "@noisefloor/shared";
import { resolveSeriesRef } from "@noisefloor/shared";
import { useMemo, useState } from "react";
import { LineTrace } from "../primitives/LineTrace.js";
import { StackedBars } from "../primitives/StackedBars.js";

const USED_COLOR = "#5cb85c";
const REMAINING_COLOR = "#3b78c4";
const SIGNAL_COLOR = "#0a0a0a";
const CHART_HEIGHT = 200;
const SIGNAL_HEIGHT = 60;

export type Period = "24h" | "1y";

// Rounds a chart's tick step to a "nice" 1/2/5-times-a-power-of-ten value
// (the standard axis-labeling trick) so ticks read as 20/40/60 rather than
// 21.4/42.8/64.2.
function niceTicks(max: number, tickCount = 5): number[] {
  if (max <= 0) return [0];
  const rawStep = max / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const residual = rawStep / magnitude;
  const niceResidual = residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1;
  const step = niceResidual * magnitude;
  const ticks: number[] = [];
  for (let v = 0; v <= max; v += step) ticks.push(Math.round(v));
  return ticks;
}

export type LinkCapacityChartProps = {
  world: World;
  seed: string | number;
  annotations?: Annotation[];
  packageLimitMbps?: number;
  caseLabel?: string;
  prompt?: string;
  initialPeriod?: Period;
};

// The real component — see PROJECT-PLAN.md D14/D15 for why a fixed-data
// stub lived at this path before. Renders NOISEFLOOR-OUTLINE.md §7's
// LinkCapacityChart behavior: stacked used/remaining bars (24h) or a
// single capacity line (1y, since World has no used/remaining split for
// the yearly series), a signal trace panel beneath, an optional
// package-limit line, and annotation callouts.
export function LinkCapacityChart({
  world,
  seed,
  annotations = [],
  packageLimitMbps,
  caseLabel = "CASE 001 · Link capacity",
  prompt = "What does this tell you about capacity?",
  initialPeriod = "24h",
}: LinkCapacityChartProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod);

  const capacityKey = period === "24h" ? "capacityDown24h" : "capacityDown1y";
  const signalKey = period === "24h" ? "signalTrace24h" : "signalTrace1y";

  const capacityPoints = useMemo(() => resolveSeriesRef(world.series[capacityKey], seed), [world, seed, capacityKey]);
  const usedPoints = useMemo(
    () => (period === "24h" ? resolveSeriesRef(world.series.usedDown24h, seed) : []),
    [world, seed, period],
  );
  const signalPoints = useMemo(() => resolveSeriesRef(world.series[signalKey], seed), [world, seed, signalKey]);

  const limit = packageLimitMbps ?? world.customer.plan.down;

  const barsData = useMemo(() => {
    if (period !== "24h") return [];
    return capacityPoints.map((p, i) => {
      const used = usedPoints[i]?.v ?? 0;
      return { t: p.t, used, remaining: Math.max(0, p.v - used) };
    });
  }, [capacityPoints, usedPoints, period]);

  const maxCapacityValue = Math.max(limit, ...capacityPoints.map((p) => p.v), 1) * 1.1;
  const capacityTicks = useMemo(() => niceTicks(maxCapacityValue), [maxCapacityValue]);

  const signalValues = signalPoints.map((p) => p.v);
  const minSignal = Math.min(...signalValues, -100);
  const maxSignal = Math.max(...signalValues, -40);

  const activeAnnotations = annotations.filter((a) => a.target.series === signalKey);

  const firstLabel = capacityPoints[0]?.t ?? "";
  const midLabel = capacityPoints[Math.floor(capacityPoints.length / 2)]?.t ?? "";
  const lastLabel = capacityPoints[capacityPoints.length - 1]?.t ?? "";

  return (
    <div className="flex flex-col gap-3 border border-foreground p-5 pb-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-xs">
          {caseLabel} · {period === "24h" ? "last 24 h" : "last year"}
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted">Mbit/s</span>
          <div className="flex gap-1" role="group" aria-label="Period">
            {(["24h", "1y"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                aria-pressed={period === p}
                className={`border border-foreground px-2 py-0.5 font-mono text-[11px] ${
                  period === p ? "bg-foreground text-background" : ""
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative shrink-0 text-right font-mono text-[10px] text-muted" style={{ height: CHART_HEIGHT, width: 24 }}>
          {capacityTicks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: CHART_HEIGHT - (tick / maxCapacityValue) * CHART_HEIGHT }}
            >
              {tick}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1 overflow-hidden border-b border-foreground" style={{ height: CHART_HEIGHT }}>
          {capacityTicks
            .filter((tick) => tick > 0)
            .map((tick) => (
              <div
                key={tick}
                className="pointer-events-none absolute inset-x-0 border-t border-muted/25"
                style={{ top: CHART_HEIGHT - (tick / maxCapacityValue) * CHART_HEIGHT }}
                aria-hidden="true"
              />
            ))}

          {period === "24h" ? (
            <StackedBars
              data={barsData}
              height={CHART_HEIGHT}
              maxValue={maxCapacityValue}
              usedColor={USED_COLOR}
              remainingColor={REMAINING_COLOR}
            />
          ) : (
            <LineTrace data={capacityPoints} height={CHART_HEIGHT} minValue={0} maxValue={maxCapacityValue} color={REMAINING_COLOR} />
          )}

          <div
            className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-foreground"
            style={{ top: CHART_HEIGHT - (limit / maxCapacityValue) * CHART_HEIGHT }}
            aria-hidden="true"
          >
            <span className="absolute right-0 -top-4 bg-background px-1 font-mono text-[10px]">{limit} plan</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="shrink-0" style={{ width: 24 }} aria-hidden="true" />
        <div className="flex flex-1 justify-between font-mono text-[11px] text-muted">
          <span>{firstLabel}</span>
          <span>{midLabel}</span>
          <span>{lastLabel}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 pt-1">
        {period === "24h" && (
          <>
            <span className="inline-flex items-center gap-2 text-[13px]">
              <span className="inline-block h-3 w-3" style={{ background: USED_COLOR }} />
              Used
            </span>
            <span className="inline-flex items-center gap-2 text-[13px]">
              <span className="inline-block h-3 w-3" style={{ background: REMAINING_COLOR }} />
              Remaining
            </span>
          </>
        )}
        {prompt && <span className="font-mono text-xs text-muted md:ml-auto">{prompt}</span>}
      </div>

      <div className="border-t border-foreground pt-2">
        <div className="mb-1 font-mono text-[11px] text-muted">Signal</div>
        <div className="relative" style={{ height: SIGNAL_HEIGHT }}>
          <LineTrace data={signalPoints} height={SIGNAL_HEIGHT} minValue={minSignal} maxValue={maxSignal} color={SIGNAL_COLOR} />
          {activeAnnotations.map((a) => {
            const index = signalPoints.findIndex((p) => p.t === a.target.t);
            if (index === -1) return null;
            const leftPct = signalPoints.length > 1 ? (index / (signalPoints.length - 1)) * 100 : 0;
            return (
              <div
                key={`${a.target.series}-${a.target.t}`}
                className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${leftPct}%` }}
              >
                <span className="h-2 w-px bg-foreground" aria-hidden="true" />
                <span className="whitespace-nowrap border border-foreground bg-background px-1 font-mono text-[10px]">
                  {a.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
