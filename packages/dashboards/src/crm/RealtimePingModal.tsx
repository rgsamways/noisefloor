import type { World } from "@noisefloor/shared";
import { LinearMeter } from "../primitives/LinearMeter.js";

export type RealtimePingModalProps = {
  world: World;
  targetLabel: string;
};

const RTT_METER_MAX_MS = 150;

// Renders NOISEFLOOR-OUTLINE.md §7's crm/RealtimePingModal — a point-in-time
// RTT/loss reading, not a trend (see World.realtimePings' own comment for
// why this is a snapshot field, not a series). Rounded/shadowed card is the
// dashboard-visual-richness carve-out in homepage/DESIGN-NOTES.md.
export function RealtimePingModal({ world, targetLabel }: RealtimePingModalProps) {
  const snapshot = world.realtimePings?.find((p) => p.targetLabel === targetLabel);
  if (!snapshot) return <p className="text-muted">No realtime ping data for "{targetLabel}".</p>;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-foreground p-3 font-mono text-xs shadow-sm">
      <span className="text-muted">{targetLabel}</span>
      <LinearMeter value={snapshot.rttMs} min={0} max={RTT_METER_MAX_MS} label="RTT (ms)" color="#3b78c4" />
      <LinearMeter value={snapshot.lossPct} min={0} max={10} label="Loss (%)" color="#e5484d" />
      {snapshot.avgRttMs !== undefined && <span>Avg RTT: {snapshot.avgRttMs} ms</span>}
    </div>
  );
}
