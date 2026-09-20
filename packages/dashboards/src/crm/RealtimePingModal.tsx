import type { World } from "@noisefloor/shared";

export type RealtimePingModalProps = {
  world: World;
  targetLabel: string;
};

const CHART_HEIGHT = 64;
const RTT_COLOR = "#3b78c4";
const LOSS_COLOR = "#e5484d";
const MAX_RTT_MS = 150;

// Renders NOISEFLOOR-OUTLINE.md §7's crm/RealtimePingModal — a short burst
// of individual ping samples ("bar chart of RTT, loss %, avg"), the real
// tool this models: fire off a dozen or so pings and watch the bars, not a
// single aggregated gauge. avg RTT and loss % are computed from the
// samples themselves so the numbers can never drift from what the bars
// show. Rounded/shadowed card is the dashboard-visual-richness carve-out
// in homepage/DESIGN-NOTES.md.
export function RealtimePingModal({ world, targetLabel }: RealtimePingModalProps) {
  const snapshot = world.realtimePings?.find((p) => p.targetLabel === targetLabel);
  if (!snapshot) return <p className="text-muted">No realtime ping data for "{targetLabel}".</p>;

  const { samples } = snapshot;
  const successful = samples.filter((s): s is number => s !== null);
  const avgRttMs = successful.length > 0 ? Math.round(successful.reduce((a, b) => a + b, 0) / successful.length) : 0;
  const lossPct = Math.round((100 * (samples.length - successful.length)) / samples.length);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-foreground p-3 font-mono text-xs shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-muted">{targetLabel}</span>
        <span>
          avg {avgRttMs} ms · loss {lossPct}%
        </span>
      </div>
      <div className="flex items-end gap-[2px]" style={{ height: CHART_HEIGHT }}>
        {samples.map((s, i) => {
          const isDrop = s === null;
          const heightPx = isDrop ? CHART_HEIGHT : Math.max(2, Math.min(CHART_HEIGHT, (s / MAX_RTT_MS) * CHART_HEIGHT));
          return (
            <div key={i} className="flex min-w-0 flex-1 flex-col justify-end" style={{ height: CHART_HEIGHT }}>
              <div
                className="rounded-t-sm"
                style={{ height: heightPx, background: isDrop ? LOSS_COLOR : RTT_COLOR }}
                title={isDrop ? "dropped" : `${s} ms`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
