// Physics/vendor thresholds for the world-consistency validator.
//
// Provenance: values marked "confirmed" were checked against Robin's own
// on-the-job RF experience during authoring of this change (2026-09-18).
// Everything else is extrapolated by Claude from those anchors and general
// 802.11-derived modulation/coding-rate progressions — NOT verified against
// Ubiquiti airMAX-AC's actual published specs. Per
// NOISEFLOOR-AUTHORING-PLAN.md §9a.2, wrong constants here teach wrong
// things with authority, so treat every non-"confirmed" number as a draft:
// safe to ship (nothing here is user-facing yet), not safe to trust for a
// real published case without a second look.

// RF link budget — confirmed.
export const CHAIN_IMBALANCE_THRESHOLD_DB = 3;

// Tolerance for CINR ≈ signal - noiseFloor. Not one of the confirmed
// anchors — a draft guess at reasonable measurement/rounding slack.
export const CINR_CONSISTENCY_TOLERANCE_DB = 5;

// SNR -> modulation rate. Index 0 unused; rates run 1X-8X.
// Confirmed anchors: rate 6 (~21 dB) and rate 8 (~30 dB). Rates 1-5 and 7
// are Claude's interpolation between/around those two anchors, not
// independently confirmed.
export const MIN_CINR_DB_FOR_RATE: Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, number> = {
  1: 6,
  2: 9,
  3: 12,
  4: 15,
  5: 18,
  6: 21, // confirmed
  7: 25,
  8: 30, // confirmed
};

// Modulation rate -> achievable capacity, expressed as Mbps per MHz of
// channel width at that rate. Confirmed anchor: rate 6 at 20 MHz lands in
// the 60-70 Mbps range Robin confirmed, i.e. ~3.25 Mbps/MHz — the other
// rates scale from that anchor by Claude's estimate of relative spectral
// efficiency, not independently confirmed. Capacity is assumed to scale
// linearly with channel width, which is a simplification (real TDD
// overhead isn't perfectly linear) acceptable for a "band", not an exact
// figure.
export const MBPS_PER_MHZ_FOR_RATE: Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, number> = {
  1: 0.8,
  2: 1.2,
  3: 1.6,
  4: 2.0,
  5: 2.6,
  6: 3.25, // confirmed anchor (20 MHz -> ~65 Mbps)
  7: 3.9,
  8: 4.5,
};

// How far a capacity value may sit from the calculated reference before
// it's flagged, expressed as a multiple of the reference. Deliberately
// wide: NOISEFLOOR-OUTLINE.md §9's own case 001 has a down/up split
// (66/93 Mbps against a ~65 Mbps single-direction reference at 20 MHz/6X)
// that the outline itself says needs "vendor math, not derivable exactly"
// (§9 Optional branch B) — a tight band would hard-fail the project's own
// canonical example. Soft between softMultiplier and hardMultiplier (needs
// a stated cause, e.g. TDD share favoring one direction); hard beyond
// hardMultiplier, where nothing plausible explains the gap.
export const CAPACITY_BAND_SOFT_MULTIPLIER = 1.3;
export const CAPACITY_BAND_HARD_MULTIPLIER = 3;
export const CAPACITY_BAND_SOFT_LOW_MULTIPLIER = 0.77; // 1 / 1.3, symmetric on the low side
export const CAPACITY_BAND_HARD_LOW_MULTIPLIER = 0.3;

// Shaper values below this are almost certainly a kbit/s-vs-Mbit/s mistake
// rather than an intentionally tiny cap — confirmed.
export const SHAPER_SUSPICIOUSLY_LOW_MBPS = 1;
