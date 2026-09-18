// STUB — placeholder ahead of Phase 1 (PROJECT-PLAN.md decision D15, an
// explicit, narrow exception to D14). The real component will render a
// World's `capacityDown24h`/`usedDown24h` SeriesRefs, resolved via
// @noisefloor/shared's `resolveSeriesRef`. This one draws the same shape
// of chart from fixed demo numbers, purely so the landing page has a real
// rendered component to point at instead of a picture. Replace the
// internals wholesale once Phase 1 (after `world-validator`, see
// PROJECT-PLAN.md D14) actually builds out the `crm/` component family —
// keep the file at this path so that work lands here, not somewhere new.

const TOTALS = [
  62, 70, 64, 58, 75, 61, 68, 66, 72, 59, 63, 77, 65, 60, 69, 74, 58, 66, 71, 62, 67, 73, 60, 64, 69, 61, 66, 70, 63,
  72, 58, 65, 68, 71, 60, 66, 74, 62, 69, 63, 67, 72, 60, 65, 70, 64, 68, 66,
];
const USED = [
  3, 4, 5, 4, 6, 5, 7, 6, 5, 8, 9, 7, 10, 12, 9, 11, 14, 18, 22, 16, 20, 26, 30, 33, 28, 24, 17, 6, 2, 1, 1, 2, 1, 1,
  2, 1, 1, 2, 1, 1, 3, 2, 1, 1, 2, 1, 1, 1,
];

const USED_COLOR = "#5cb85c";
const REMAINING_COLOR = "#3b78c4";
const CHART_HEIGHT = 200;
const MAX_VALUE = 90;

export type LinkCapacityChartProps = {
  caseLabel?: string;
  prompt?: string;
};

export function LinkCapacityChart({
  caseLabel = "CASE 001 · Link capacity · last 24 h",
  prompt = "What does this tell you about capacity?",
}: LinkCapacityChartProps) {
  const scale = CHART_HEIGHT / MAX_VALUE;
  const bars = TOTALS.map((total, i) => {
    const used = USED[i] ?? 0;
    return { usedPx: used * scale, remainingPx: (total - used) * scale };
  });

  return (
    <div className="flex flex-col gap-3 border border-foreground p-5 pb-4">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs">{caseLabel}</span>
        <span className="font-mono text-xs text-muted">Mbit/s</span>
      </div>
      <div className="flex items-end gap-[3px] border-b border-foreground" style={{ height: CHART_HEIGHT }}>
        {bars.map((bar, i) => (
          <div key={i} className="flex w-[9px] flex-col justify-end" style={{ height: CHART_HEIGHT }}>
            <div style={{ height: bar.remainingPx, background: REMAINING_COLOR }} />
            <div style={{ height: bar.usedPx, background: USED_COLOR }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between font-mono text-[11px] text-muted">
        <span>11:18</span>
        <span>22:18</span>
        <span>10:58</span>
      </div>
      <div className="flex flex-wrap items-center gap-5 pt-1">
        <span className="inline-flex items-center gap-2 text-[13px]">
          <span className="inline-block h-3 w-3" style={{ background: USED_COLOR }} />
          Used
        </span>
        <span className="inline-flex items-center gap-2 text-[13px]">
          <span className="inline-block h-3 w-3" style={{ background: REMAINING_COLOR }} />
          Remaining
        </span>
        {prompt && <span className="font-mono text-xs text-muted md:ml-auto">{prompt}</span>}
      </div>
    </div>
  );
}
