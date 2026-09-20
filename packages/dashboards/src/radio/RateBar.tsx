import type { World } from "@noisefloor/shared";
import { expectedRateForCinr } from "@noisefloor/shared";
import { SegmentBar } from "../primitives/SegmentBar.js";

export type RateBarProps = {
  world: World;
};

// Visual-only scale across the eight rate tiers (red -> indigo), matching
// the real tool's colored modulation-rate track — not a good/bad severity
// signal. See dashboard-visual-richness's design.md.
const RATE_SCALE_COLORS = ["#e5484d", "#f2994a", "#f2c94c", "#a8c93c", "#2bb673", "#2ba8a8", "#3b78c4", "#6c5ce7"];

function Side({ label, rate, cinrDb }: { label: string; rate: number; cinrDb: number }) {
  const expected = expectedRateForCinr(cinrDb);
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-lg border border-foreground p-3 font-mono text-xs shadow-sm">
      <span className="text-muted">
        {label} — {rate}X actual, CINR {cinrDb} dB
      </span>
      <SegmentBar filledCount={rate} totalCount={8} expectedCount={expected} segmentColors={RATE_SCALE_COLORS} />
    </div>
  );
}

// Renders NOISEFLOOR-OUTLINE.md §7's radio/RateBar: 1X-8X modulation as a
// filled segment bar, with the rate the link's CINR could sustain marked
// via expectedRateForCinr — the same table world-consistency-validator's
// SNR-modulation rule uses, so this never independently drifts from it.
// Rounded/shadowed cards and the colored scale are the
// dashboard-visual-richness carve-out in homepage/DESIGN-NOTES.md.
export function RateBar({ world }: RateBarProps) {
  const { link } = world;

  return (
    <div className="flex gap-3 border border-foreground p-5 pb-4">
      <Side label="Local" rate={link.rateLocal} cinrDb={link.cinrLocalDb} />
      <Side label="Remote" rate={link.rateRemote} cinrDb={link.cinrRemoteDb} />
    </div>
  );
}
