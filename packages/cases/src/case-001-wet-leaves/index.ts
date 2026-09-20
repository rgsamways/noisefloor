import type { Case } from "@noisefloor/shared";
import { stages } from "./stages.js";
import { world } from "./world.js";

// Case 001 — "It's slow when it rains" (NOISEFLOOR-OUTLINE.md §9), now the
// full 10-stage case: the foliage arc (1, 4, 5), the RF-anomaly detour
// (2, 3), and the shaper-collapse incident (6-10). Optional branches A/B
// still aren't authored — see openspec/changes/case-001-shaper-incident's
// proposal.md.
export const caseOne: Case = {
  id: "case-001",
  slug: "wet-leaves",
  title: "It's slow when it rains",
  version: 1,
  difficulty: 2,
  estimatedMinutes: 25,
  tags: ["foliage", "seasonal-signal", "chain-imbalance", "shaping", "units", "what-changed", "own-your-change"],
  gotchas: [
    "seasonal-signal-is-trees",
    "chain-imbalance",
    "cable-snr-threshold",
    "router-mode-memory",
    "shaper-units-kbps",
    "ping-good-throughput-zero",
    "what-changed-when",
    "own-your-change",
  ],
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
      "Two separate things were wrong here, and the ticket only makes sense once they're pulled apart. " +
      "The 24-hour chart ruled out the obvious read — usage was never close to the ceiling, so this was " +
      "never a capacity problem in the day-to-day sense, and the RF numbers (20 MHz, 6X, TDD) already " +
      "explain the ceiling itself. The year view told the real long-term story: a signal trace that dips " +
      "every year around the same late-May date and doesn't fully recover until October, worse by a few " +
      "dB than the year before — foliage growing back in, not hardware or alignment, since realigning a " +
      "dish doesn't explain why a problem tracks a calendar date. That's the seasonal complaint settled, " +
      "with a survey carried forward rather than a promise made today.\n\n" +
      "Separately, and around the same time, a shaper profile got edited on this CPE — an unrelated " +
      "maintenance change that collapsed real throughput to a 50 kbit/s trickle while leaving ICMP " +
      "(ping) completely healthy, which is exactly why \"is she online?\" looked like a yes right up " +
      "until the traffic graph showed a suspiciously symmetric trickle — the signature of a starved " +
      "management channel, not a customer session. Fixing it meant getting past a web UI that itself " +
      "needs more than 50 kbit/s to load: either a backup restore or an SSH session, and naming the " +
      "exact change (not another truck roll or reboot) is what actually made it fast.",
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
      {
        evidence: { kind: "dashboard", family: "nms", view: "DeviceOverview" },
        annotations: [],
      },
    ],
    gotchaIds: [
      "seasonal-signal-is-trees",
      "chain-imbalance",
      "cable-snr-threshold",
      "shaper-units-kbps",
      "ping-good-throughput-zero",
      "what-changed-when",
      "own-your-change",
    ],
  },
  author: { kind: "curated" },
  visibility: "public",
};
