export type StackedBarDatum = {
  t: string;
  used: number;
  remaining: number;
};

export type StackedBarsProps = {
  data: StackedBarDatum[];
  height: number;
  maxValue: number;
  usedColor: string;
  remainingColor: string;
};

// One internal chart layer, per NOISEFLOOR-OUTLINE.md §7 — plain divs, no
// charting library. Kept narrow to exactly what LinkCapacityChart needs;
// broaden only once a second consumer (Phase 3's radio/nms components)
// shows what a shared shape should actually look like.
export function StackedBars({ data, height, maxValue, usedColor, remainingColor }: StackedBarsProps) {
  const scale = height / maxValue;

  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((d, i) => (
        <div key={`${d.t}-${i}`} className="flex w-[9px] flex-col justify-end" style={{ height }}>
          <div style={{ height: Math.max(0, d.remaining * scale), background: remainingColor }} />
          <div style={{ height: Math.max(0, d.used * scale), background: usedColor }} />
        </div>
      ))}
    </div>
  );
}
