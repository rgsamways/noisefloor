// The four-tier scale from docs/CONSOLE-VISUAL-DIRECTION.md — color carries
// meaning, not decoration. Reused everywhere a reading can be judged
// healthy or not, not a different color per widget.
export type Severity = "good" | "ok" | "warn" | "bad";

export const SEVERITY_COLORS: Record<Severity, string> = {
  good: "#2bd47e",
  ok: "#c6ff5e",
  warn: "#ffb443",
  bad: "#ff5e6c",
};

// v1 heuristic on linkQualityPct alone, not yet reviewed against real link
// numbers — see openspec/changes/radio-console-ui design.md's Risks.
const GOOD_THRESHOLD = 85;
const OK_THRESHOLD = 65;
const WARN_THRESHOLD = 40;

export function linkQualityToSeverity(pct: number): Severity {
  if (pct >= GOOD_THRESHOLD) return "good";
  if (pct >= OK_THRESHOLD) return "ok";
  if (pct >= WARN_THRESHOLD) return "warn";
  return "bad";
}
