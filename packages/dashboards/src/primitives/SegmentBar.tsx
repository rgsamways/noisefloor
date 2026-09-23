export type SegmentBarProps = {
  filledCount: number;
  totalCount: number;
  expectedCount?: number;
  filledColor?: string;
  // Per-segment colors (segmentColors[0] is segment 1, etc.), overriding
  // filledColor when provided. Optional — added for radio/RateBar's colored
  // rate scale (dashboard-visual-richness); a caller that doesn't pass it
  // gets the original single-color behavior unchanged.
  segmentColors?: string[];
  // Below: additive, HUD-console-only options. Each defaults to exactly
  // today's rendered class names when omitted — existing callers are
  // unaffected. See openspec/changes/radio-console-ui.
  borderColor?: string;
  expectedBorderColor?: string;
  // Flat/no-radius segments, matching the console mockup, instead of the
  // default rounded-sm corners.
  square?: boolean;
};

const DEFAULT_BORDER_CLASS = "border-muted";
const DEFAULT_EXPECTED_BORDER_CLASS = "border-2 border-dashed border-foreground";

// One internal chart layer, per NOISEFLOOR-OUTLINE.md §7 — plain divs, no
// charting library, matching StackedBars/LineTrace's precedent. Built for
// radio/RateBar's 1X-8X display; kept to exactly that shape until a second
// consumer shows what a shared shape should actually look like.
export function SegmentBar({
  filledCount,
  totalCount,
  expectedCount,
  filledColor = "#0a0a0a",
  segmentColors,
  borderColor = DEFAULT_BORDER_CLASS,
  expectedBorderColor = DEFAULT_EXPECTED_BORDER_CLASS,
  square = false,
}: SegmentBarProps) {
  const segments = Array.from({ length: totalCount }, (_, i) => i + 1);
  const radiusClass = square ? "rounded-none" : "rounded-sm";

  return (
    <div className="flex gap-[3px]" role="img" aria-label={`${filledCount} of ${totalCount}`}>
      {segments.map((n) => {
        const filled = n <= filledCount;
        const isExpected = expectedCount !== undefined && expectedCount !== filledCount && n === expectedCount;
        const color = segmentColors?.[n - 1] ?? filledColor;
        return (
          <div
            key={n}
            className={`h-4 w-3 border ${radiusClass} ${isExpected ? expectedBorderColor : borderColor}`}
            style={{ background: filled ? color : "transparent" }}
          />
        );
      })}
    </div>
  );
}
