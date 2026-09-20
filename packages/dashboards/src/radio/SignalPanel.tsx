import type { World } from "@noisefloor/shared";
import { LinearMeter } from "../primitives/LinearMeter.js";

export type SignalPanelProps = {
  world: World;
};

// Matches the axis assumption LinkCapacityChart's own signal panel already
// uses (Math.min(...signalValues, -100) / Math.max(...signalValues, -40)) —
// one consistent "typical signal range" rather than two guessed ranges.
const SIGNAL_METER_MIN_DBM = -100;
const SIGNAL_METER_MAX_DBM = -40;

function chainDelta(chains: readonly [number, number]): number {
  return Math.max(...chains) - Math.min(...chains);
}

function Side({
  label,
  signalDbm,
  chains,
  noiseFloorDbm,
}: {
  label: string;
  signalDbm: number;
  chains: readonly [number, number];
  noiseFloorDbm: number;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-lg border border-foreground p-3 font-mono text-xs shadow-sm">
      <span className="text-muted">{label}</span>
      <span className="text-base font-semibold">{signalDbm} dBm</span>
      <LinearMeter value={chains[0]} min={SIGNAL_METER_MIN_DBM} max={SIGNAL_METER_MAX_DBM} label="Chain 1" color="#3b78c4" />
      <LinearMeter value={chains[1]} min={SIGNAL_METER_MIN_DBM} max={SIGNAL_METER_MAX_DBM} label="Chain 2" color="#3b78c4" />
      <span>Δ {chainDelta(chains)} dB · Noise floor: {noiseFloorDbm} dBm</span>
    </div>
  );
}

// Renders NOISEFLOOR-OUTLINE.md §7's radio/SignalPanel — signal dBm with
// per-chain values and noise floor for both sides, computing the chain
// delta directly (per the chain-imbalance gotcha: >3 dB means off-axis or
// partial obstruction) rather than leaving the viewer to subtract it.
// Rounded/shadowed cards and the chain LinearMeters are the
// dashboard-visual-richness carve-out in homepage/DESIGN-NOTES.md.
export function SignalPanel({ world }: SignalPanelProps) {
  const { link } = world;

  return (
    <div className="flex gap-3 border border-foreground p-5 pb-4">
      <Side label="Local" signalDbm={link.signalLocalDbm} chains={link.chainsLocal} noiseFloorDbm={link.noiseFloorLocalDbm} />
      <Side
        label="Remote"
        signalDbm={link.signalRemoteDbm}
        chains={link.chainsRemote}
        noiseFloorDbm={link.noiseFloorRemoteDbm}
      />
    </div>
  );
}
