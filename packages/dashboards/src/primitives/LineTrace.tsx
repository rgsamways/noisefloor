import { useId } from "react";

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
  // Gradient area-fill beneath the line, fading to transparent — the
  // dashboard-component visual carve-out in homepage/DESIGN-NOTES.md.
  // Off by default; each caller opts in per instance.
  fill?: boolean;
};

// Plain SVG polyline, no charting library, matching StackedBars' approach
// (NOISEFLOOR-OUTLINE.md §7). preserveAspectRatio="none" lets the SVG
// stretch to its container's actual width via width="100%" while the
// viewBox stays a fixed coordinate space for point placement.
export function LineTrace({ data, height, minValue, maxValue, color, viewBoxWidth = 600, fill = false }: LineTraceProps) {
  const gradientId = useId();
  if (data.length === 0) return null;

  const range = maxValue - minValue || 1;
  const stepX = data.length > 1 ? viewBoxWidth / (data.length - 1) : 0;
  const coords = data.map((d, i) => {
    const x = i * stepX;
    const y = height - ((d.v - minValue) / range) * height;
    return { x, y };
  });
  const points = coords.map((p) => `${p.x},${p.y}`).join(" ");
  const lastX = coords[coords.length - 1]?.x ?? 0;
  const areaPath = `M0,${height} L${points} L${lastX},${height} Z`;

  return (
    <svg viewBox={`0 0 ${viewBoxWidth} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      {fill && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        </>
      )}
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}
