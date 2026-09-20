export type SegmentBarProps = {
  filledCount: number;
  totalCount: number;
  expectedCount?: number;
  filledColor?: string;
};

// One internal chart layer, per NOISEFLOOR-OUTLINE.md §7 — plain divs, no
// charting library, matching StackedBars/LineTrace's precedent. Built for
// radio/RateBar's 1X-8X display; kept to exactly that shape until a second
// consumer shows what a shared shape should actually look like.
export function SegmentBar({ filledCount, totalCount, expectedCount, filledColor = "#0a0a0a" }: SegmentBarProps) {
  const segments = Array.from({ length: totalCount }, (_, i) => i + 1);

  return (
    <div className="flex gap-[3px]" role="img" aria-label={`${filledCount} of ${totalCount}`}>
      {segments.map((n) => {
        const filled = n <= filledCount;
        const isExpected = expectedCount !== undefined && expectedCount !== filledCount && n === expectedCount;
        return (
          <div
            key={n}
            className={`h-4 w-3 border ${isExpected ? "border-2 border-dashed border-foreground" : "border-muted"}`}
            style={{ background: filled ? filledColor : "transparent" }}
          />
        );
      })}
    </div>
  );
}
