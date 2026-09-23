export type LinearMeterProps = {
  value: number;
  min: number;
  max: number;
  label: string;
  color?: string;
  // Below: additive, HUD-console-only options. Each defaults to exactly
  // today's rendered output when omitted — existing callers are unaffected.
  // See openspec/changes/radio-console-ui.
  trackColor?: string;
  // Flat/no-radius track+fill, matching the console mockup, instead of the
  // default rounded-full pill shape.
  square?: boolean;
  labelClassName?: string;
  valueClassName?: string;
};

const DEFAULT_LABEL_CLASS = "font-mono text-[11px] text-muted";
const DEFAULT_VALUE_CLASS = "font-semibold text-foreground";

// The linear counterpart to Gauge — a horizontal filled bar for a value
// within a range, per dashboard-visual-richness-2's design.md. Plain
// div/CSS, no charting library, matching StackedBars/LineTrace's precedent.
export function LinearMeter({
  value,
  min,
  max,
  label,
  color = "#0a0a0a",
  trackColor = "#e5e5e5",
  square = false,
  labelClassName = DEFAULT_LABEL_CLASS,
  valueClassName = DEFAULT_VALUE_CLASS,
}: LinearMeterProps) {
  const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const radiusClass = square ? "rounded-none" : "rounded-full";

  return (
    <div className="flex flex-col gap-1">
      <div className={`flex items-baseline justify-between ${labelClassName}`}>
        <span>{label}</span>
        <span className={valueClassName}>{value}</span>
      </div>
      <div className={`h-2 w-full ${radiusClass}`} style={{ background: trackColor }}>
        <div className={`h-full ${radiusClass}`} style={{ width: `${fraction * 100}%`, background: color }} />
      </div>
    </div>
  );
}
