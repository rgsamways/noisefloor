export type LinearMeterProps = {
  value: number;
  min: number;
  max: number;
  label: string;
  color?: string;
};

// The linear counterpart to Gauge — a horizontal filled bar for a value
// within a range, per dashboard-visual-richness-2's design.md. Plain
// div/CSS, no charting library, matching StackedBars/LineTrace's precedent.
export function LinearMeter({ value, min, max, label, color = "#0a0a0a" }: LinearMeterProps) {
  const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between font-mono text-[11px] text-muted">
        <span>{label}</span>
        <span className="font-semibold text-foreground">{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#e5e5e5]">
        <div className="h-full rounded-full" style={{ width: `${fraction * 100}%`, background: color }} />
      </div>
    </div>
  );
}
