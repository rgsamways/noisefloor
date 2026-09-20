import type { World } from "@noisefloor/shared";
import { expectedRateForCinr } from "@noisefloor/shared";
import { SegmentBar } from "../primitives/SegmentBar.js";

export type RateBarProps = {
  world: World;
};

function Side({ label, rate, cinrDb }: { label: string; rate: number; cinrDb: number }) {
  const expected = expectedRateForCinr(cinrDb);
  return (
    <div className="flex flex-1 flex-col gap-2 border border-foreground p-3 font-mono text-xs">
      <span className="text-muted">
        {label} — {rate}X actual, CINR {cinrDb} dB
      </span>
      <SegmentBar filledCount={rate} totalCount={8} expectedCount={expected} />
    </div>
  );
}

// Renders NOISEFLOOR-OUTLINE.md §7's radio/RateBar: 1X-8X modulation as a
// filled segment bar, with the rate the link's CINR could sustain marked
// via expectedRateForCinr — the same table world-consistency-validator's
// SNR-modulation rule uses, so this never independently drifts from it.
export function RateBar({ world }: RateBarProps) {
  const { link } = world;

  return (
    <div className="flex gap-3 border border-foreground p-5 pb-4">
      <Side label="Local" rate={link.rateLocal} cinrDb={link.cinrLocalDb} />
      <Side label="Remote" rate={link.rateRemote} cinrDb={link.cinrRemoteDb} />
    </div>
  );
}
