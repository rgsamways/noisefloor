export type GaugeProps = {
  value: number;
  max: number;
  label: string;
  color?: string;
  size?: number;
};

const STROKE_WIDTH = 8;

// Circular SVG ring — plain SVG, no charting/gauge library, matching
// StackedBars/LineTrace's precedent (NOISEFLOOR-OUTLINE.md §7). Part of the
// dashboard-visual-richness carve-out in homepage/DESIGN-NOTES.md: rounded
// linecap and color are what a flat bar/text stat can't give you.
export function Gauge({ value, max, label, color = "#0a0a0a", size = 96 }: GaugeProps) {
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.max(0, Math.min(1, value / max));
  const dashOffset = circumference * (1 - fraction);
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-1" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#e5e5e5" strokeWidth={STROKE_WIDTH} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
        <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.22} fontWeight={600}>
          {value}
        </text>
      </svg>
      <span className="text-center font-mono text-[11px] text-muted">{label}</span>
    </div>
  );
}
