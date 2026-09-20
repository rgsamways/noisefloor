import type { World } from "@noisefloor/shared";

export type SignalPanelProps = {
  world: World;
};

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
    <div className="flex flex-1 flex-col gap-1 border border-foreground p-3 font-mono text-xs">
      <span className="text-muted">{label}</span>
      <span className="text-base font-semibold">{signalDbm} dBm</span>
      <span>
        Chains: {chains[0]} / {chains[1]} dBm (Δ {chainDelta(chains)} dB)
      </span>
      <span>Noise floor: {noiseFloorDbm} dBm</span>
    </div>
  );
}

// Renders NOISEFLOOR-OUTLINE.md §7's radio/SignalPanel — signal dBm with
// per-chain values and noise floor for both sides, computing the chain
// delta directly (per the chain-imbalance gotcha: >3 dB means off-axis or
// partial obstruction) rather than leaving the viewer to subtract it.
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
