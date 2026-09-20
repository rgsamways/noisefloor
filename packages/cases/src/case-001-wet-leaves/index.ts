import type { Case } from "@noisefloor/shared";
import { stages } from "./stages.js";
import { world } from "./world.js";

// Case 001 — "It's slow when it rains" (NOISEFLOOR-OUTLINE.md §9), now
// covering stages 1-5 (the foliage arc plus the RF-anomaly detour) of the
// eventual ten. tags/gotchas/estimatedMinutes are trimmed to only what
// these five stages exercise — the shaper-collapse subplot (stages 6-10:
// shaping, units, what-changed, own-your-change) lands later.
export const caseOne: Case = {
  id: "case-001",
  slug: "wet-leaves",
  title: "It's slow when it rains",
  version: 1,
  difficulty: 2,
  estimatedMinutes: 15,
  tags: ["foliage", "seasonal-signal", "chain-imbalance"],
  gotchas: ["seasonal-signal-is-trees", "chain-imbalance", "cable-snr-threshold", "router-mode-memory"],
  world,
  opening: {
    ticketText:
      "Customer M. Ferrier (SYN-00417, 35/10) called in — says the internet has been \"slow when it rains\" " +
      "for the last couple of weeks. No outage, just feels worse than it used to.",
    evidence: [],
  },
  stages,
  debrief: {
    narrative:
      "The 24-hour chart ruled out the obvious read — usage was never close to the ceiling, so this " +
      "was never a capacity problem in the day-to-day sense. The year view told the real story: a " +
      "signal trace that dips every year around the same late-May date and doesn't fully recover until " +
      "October, worse by a few dB than the year before. That's foliage growing back in, not hardware " +
      "failing or a radio going out of alignment — realigning a dish doesn't explain why the problem " +
      "tracks a calendar date instead of a compass heading. The right message to the customer names the " +
      "real cause, doesn't promise a fix that isn't scheduled, and sets up the survey that actually " +
      "addresses it.",
    // Only the 1y chart gets replayed — the 24h chart's insight is about its
    // overall shape (a real but unremarkable ceiling), not a single instant,
    // so there's nothing honest to anchor a callout to on it. "05-28" and
    // "10-25" are real generated points (foliageYear steps every 3 days from
    // day 1 — see world.ts's own note on this), not hand-picked calendar
    // dates that happen to look right.
    annotatedReplays: [
      {
        evidence: { kind: "dashboard", family: "crm", view: "LinkCapacityChart", worldSlice: "1y" },
        annotations: [
          {
            target: { series: "signalTrace1y", t: "05-28" },
            label: "Leaf-out — drops toward −72 dBm.",
          },
          {
            target: { series: "signalTrace1y", t: "10-25" },
            label: "Leaves drop — recovers.",
          },
        ],
      },
    ],
    gotchaIds: ["seasonal-signal-is-trees"],
  },
  author: { kind: "curated" },
  visibility: "public",
};
