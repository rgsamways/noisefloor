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

// Field-confirmed: alignment problems are "obvious" once chain delta
// reaches roughly 5 dB or more (see simulation-engine's
// windMisalignmentFault comment) — that's the warn/bad boundary here.
// Judged independently from linkQualityToSeverity: a chain-imbalance-only
// fault (wind misalignment, cable degradation) should visibly color the
// chain readings even when linkQualityPct — and therefore the column's
// overall badge — hasn't moved.
const CHAIN_OK_THRESHOLD_DB = 3;
const CHAIN_WARN_THRESHOLD_DB = 5;
const CHAIN_BAD_THRESHOLD_DB = 8;

export function chainImbalanceToSeverity(imbalanceDb: number): Severity {
  const magnitude = Math.abs(imbalanceDb);
  if (magnitude >= CHAIN_BAD_THRESHOLD_DB) return "bad";
  if (magnitude >= CHAIN_WARN_THRESHOLD_DB) return "warn";
  if (magnitude >= CHAIN_OK_THRESHOLD_DB) return "ok";
  return "good";
}
