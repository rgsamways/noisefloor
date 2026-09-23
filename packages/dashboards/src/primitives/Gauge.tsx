import { useId } from "react";

export type GaugeProps = {
  value: number;
  max: number;
  label: string;
  color?: string;
  size?: number;
  // Below: additive, HUD-console-only options. Each defaults to exactly
  // today's rendered output when omitted — existing callers (radio/
  // LinkHeader, etc.) are unaffected. See openspec/changes/radio-console-ui.
  trackColor?: string;
  // Two-stop stroke gradient, overriding `color` when present.
  gradient?: [string, string];
  // Drop-shadow glow on the arc, matching the console mockup.
  glow?: boolean;
  valueColor?: string;
};

const STROKE_WIDTH = 8;

// Circular SVG ring — plain SVG, no charting/gauge library, matching
// StackedBars/LineTrace's precedent (NOISEFLOOR-OUTLINE.md §7). Part of the
// dashboard-visual-richness carve-out in homepage/DESIGN-NOTES.md: rounded
// linecap and color are what a flat bar/text stat can't give you.
export function Gauge({
  value,
  max,
  label,
  color = "#0a0a0a",
  size = 96,
  trackColor = "#e5e5e5",
  gradient,
  glow = false,
  valueColor,
}: GaugeProps) {
  const gradientId = useId();
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.max(0, Math.min(1, value / max));
  const dashOffset = circumference * (1 - fraction);
  const center = size / 2;
  const stroke = gradient ? `url(#${gradientId})` : color;
  const glowColor = gradient?.[0] ?? color;
  // No fill attribute at all when neither is set — matches the original
  // markup exactly (SVG's initial black), rather than an approximated
  // near-black default. A gradient gauge defaults its number to the same
  // gradient as the ring, matching the console mockup's gradient-text
  // digits, unless the caller explicitly overrides valueColor.
  const textFill = valueColor ?? (gradient ? stroke : undefined);

  return (
    <div className="flex flex-col items-center gap-1" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gradient && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="100%" stopColor={gradient[1]} />
            </linearGradient>
          </defs>
        )}
        <circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor} strokeWidth={STROKE_WIDTH} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
          style={glow ? { filter: `drop-shadow(0 0 6px ${glowColor}66)` } : undefined}
        />
        <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.22} fontWeight={600} fill={textFill}>
          {value}
        </text>
      </svg>
      <span className="text-center font-mono text-[11px] text-muted">{label}</span>
    </div>
  );
}
