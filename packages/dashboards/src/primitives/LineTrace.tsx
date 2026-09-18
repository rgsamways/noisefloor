export type LineTraceDatum = {
  t: string;
  v: number;
};

export type LineTraceProps = {
  data: LineTraceDatum[];
  height: number;
  minValue: number;
  maxValue: number;
  color: string;
  viewBoxWidth?: number;
};

// Plain SVG polyline, no charting library, matching StackedBars' approach
// (NOISEFLOOR-OUTLINE.md §7). preserveAspectRatio="none" lets the SVG
// stretch to its container's actual width via width="100%" while the
// viewBox stays a fixed coordinate space for point placement.
export function LineTrace({ data, height, minValue, maxValue, color, viewBoxWidth = 600 }: LineTraceProps) {
  if (data.length === 0) return null;

  const range = maxValue - minValue || 1;
  const stepX = data.length > 1 ? viewBoxWidth / (data.length - 1) : 0;
  const points = data
    .map((d, i) => {
      const x = i * stepX;
      const y = height - ((d.v - minValue) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${viewBoxWidth} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}
