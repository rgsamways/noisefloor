import type { World } from "@noisefloor/shared";
import { resolveSeriesRef } from "@noisefloor/shared";
import { useMemo } from "react";
import { LineTrace } from "../primitives/LineTrace.js";

export type DeviceOverviewProps = {
  world: World;
  seed: string | number;
};

const CHART_HEIGHT = 120;
const RX_COLOR = "#3b78c4";
const TX_COLOR = "#2bb673";
// Deliberately kbit/s, not converted to Mbps — the shaper-units-kbps gotcha
// (NOISEFLOOR-OUTLINE.md §9) is exactly about airOS shaper fields being
// kbit/s, easy to misread as Mbps.
const LOW_THROUGHPUT_KBPS_THRESHOLD_FRACTION = 0.1;

// Renders NOISEFLOOR-OUTLINE.md §7's nms/DeviceOverview: RX/TX throughput
// over the same hour (symmetric RX≈TX is the "management chatter, not a
// real session" tell), plus link potential/capacity and a computed status
// badge. Rounded/shadowed card is the dashboard-visual-richness carve-out
// in homepage/DESIGN-NOTES.md.
export function DeviceOverview({ world, seed }: DeviceOverviewProps) {
  const rxPoints = useMemo(() => resolveSeriesRef(world.series.throughputRx1h, seed), [world, seed]);
  const txPoints = useMemo(
    () => (world.series.throughputTx1h ? resolveSeriesRef(world.series.throughputTx1h, seed) : []),
    [world, seed],
  );

  const allValues = [...rxPoints.map((p) => p.v), ...txPoints.map((p) => p.v)];
  const maxValue = Math.max(...allValues, 1) * 1.1;

  const capacityKbps = world.link.capacityDownMbps * 1000;
  const lastRxKbps = rxPoints[rxPoints.length - 1]?.v ?? 0;
  const needsImprovement = lastRxKbps < capacityKbps * LOW_THROUGHPUT_KBPS_THRESHOLD_FRACTION;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-foreground p-5 pb-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-3 font-mono text-xs">
        <span>Device overview — last 1 h</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] ${
            needsImprovement ? "bg-red-100 text-red-700" : "bg-[#e6f4ea] text-[#2bb673]"
          }`}
        >
          {needsImprovement ? "Link Needs Improvement" : "Healthy"}
        </span>
      </div>

      <div className="relative" style={{ height: CHART_HEIGHT }}>
        <LineTrace data={rxPoints} height={CHART_HEIGHT} minValue={0} maxValue={maxValue} color={RX_COLOR} fill />
        {txPoints.length > 0 && (
          <div className="absolute inset-0">
            <LineTrace data={txPoints} height={CHART_HEIGHT} minValue={0} maxValue={maxValue} color={TX_COLOR} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-5 font-mono text-[13px]">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: RX_COLOR }} />
          RX (kbit/s)
        </span>
        {txPoints.length > 0 && (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: TX_COLOR }} />
            TX (kbit/s)
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-foreground pt-2 font-mono text-xs text-muted">
        <span>Link potential: {world.link.linkPotentialPct}%</span>
        <span>Capacity: {world.link.capacityDownMbps} Mbps</span>
      </div>
    </div>
  );
}
