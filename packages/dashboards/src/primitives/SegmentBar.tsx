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
};

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
}: SegmentBarProps) {
  const segments = Array.from({ length: totalCount }, (_, i) => i + 1);

  return (
    <div className="flex gap-[3px]" role="img" aria-label={`${filledCount} of ${totalCount}`}>
      {segments.map((n) => {
        const filled = n <= filledCount;
        const isExpected = expectedCount !== undefined && expectedCount !== filledCount && n === expectedCount;
        const color = segmentColors?.[n - 1] ?? filledColor;
        return (
          <div
            key={n}
            className={`h-4 w-3 rounded-sm border ${isExpected ? "border-2 border-dashed border-foreground" : "border-muted"}`}
            style={{ background: filled ? color : "transparent" }}
          />
        );
      })}
    </div>
  );
}
