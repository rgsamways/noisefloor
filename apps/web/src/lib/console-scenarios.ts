import type { SimulationConfig, ServiceLayerConfig } from "@noisefloor/simulation-engine";
import {
  windMisalignmentFault,
  rainFadeFault,
  cableDegradationFault,
  foliageGrowthFault,
  interferenceFault,
  expiredLeaseFault,
  doubleNatFault,
  customerRouterOfflineFault,
  wrongBootOrderFault,
} from "@noisefloor/simulation-engine";

// Every fault below triggers far in the past (relative to the demo's
// atSec=0 start) so it's already fully in effect the moment a visitor
// selects it — same convention demo-link-telemetry.ts's original hardcoded
// scenario used for foliageGrowthFault.
const TRIGGERED_IN_PAST_SEC = -1_000_000;

// Well below simulation-engine's 14-day default baseUptimeSeconds, so the
// radio reads as recently rebooted — used only by Wrong Boot Order, which
// needs that contrast against a service layer that never recovered.
const RECENT_REBOOT_UPTIME_SECONDS = 5 * 60;

export type ScenarioKey =
  | "healthy"
  | "windMisalignment"
  | "rainFade"
  | "cableDegradation"
  | "foliageGrowth"
  | "interference"
  | "expiredLease"
  | "doubleNat"
  | "customerRouterOffline"
  | "wrongBootOrder";

// Each field, when present, replaces the corresponding base config value
// wholesale (not deep-merged) — a scenario only ever needs to set
// `scenario` and/or `baseUptimeSeconds`, never `linkProfile`/`seed`.
export type ScenarioDefinition = {
  label: string;
  local?: Partial<SimulationConfig>;
  remote?: Partial<SimulationConfig>;
  serviceLayer?: Partial<ServiceLayerConfig>;
};

// Radio-link faults apply to the LOCAL (CPE) side — see
// demo-link-telemetry.ts's comment on why LOCAL is the CPE — and also to
// REMOTE for the three faults whose real signature is symmetric (Wind
// Misalignment, Rain Fade, Foliage Growth). Interference stays LOCAL-only,
// matching its real one-sided-per-receiver behavior. The service layer
// stays healthy unless a scenario says otherwise.
export const SCENARIOS: Record<ScenarioKey, ScenarioDefinition> = {
  healthy: {
    label: "Healthy",
  },
  windMisalignment: {
    label: "Wind misalignment",
    // Real misalignment degrades both directions roughly equally (the
    // tower hears the CPE worse too) — see
    // docs/t1-wireless-troubleshooting-scenarios.md §1. Applying the same
    // fault array to both configs needs no engine-level symmetry
    // mechanism; each side computes its own dB delta from its own
    // baseline (design.md's Decision 5).
    local: { scenario: { faults: [...windMisalignmentFault(TRIGGERED_IN_PAST_SEC)] } },
    remote: { scenario: { faults: [...windMisalignmentFault(TRIGGERED_IN_PAST_SEC)] } },
  },
  rainFade: {
    label: "Rain fade",
    // holdSec is set far longer than any realistic browsing session so the
    // fault (which does recover, unlike the others) reads as steady rain
    // rather than clearing mid-visit.
    // Symmetric LOCAL+REMOTE application — see windMisalignment's comment
    // above; rain attenuates the path itself, affecting both ends equally.
    local: {
      scenario: {
        faults: [rainFadeFault(TRIGGERED_IN_PAST_SEC, { rampSec: 100, holdSec: 10_000_000, recoverSec: 100 })],
      },
    },
    remote: {
      scenario: {
        faults: [rainFadeFault(TRIGGERED_IN_PAST_SEC, { rampSec: 100, holdSec: 10_000_000, recoverSec: 100 })],
      },
    },
  },
  foliageGrowth: {
    label: "Foliage growth",
    // Symmetric LOCAL+REMOTE application — see windMisalignment's comment
    // above; foliage in the path attenuates both directions equally.
    local: { scenario: { faults: [foliageGrowthFault(TRIGGERED_IN_PAST_SEC, { rampSec: 100 })] } },
    remote: { scenario: { faults: [foliageGrowthFault(TRIGGERED_IN_PAST_SEC, { rampSec: 100 })] } },
  },
  interference: {
    label: "Interference",
    // Overrides the fault's real-world-realistic default (a daily cycle)
    // with a much shorter one, so a visitor watching for under a minute
    // actually sees it toggle — a demo-observability choice, not a claim
    // about real interference cadence.
    local: {
      scenario: {
        faults: [interferenceFault(TRIGGERED_IN_PAST_SEC, { cyclePeriodSec: 30, activeDurationSec: 12 })],
      },
    },
  },
  cableDegradation: {
    label: "Cable degradation",
    // Ethernet/PoE-run fault, not RF — see demo-link-telemetry.ts and
    // simulation-engine's own cableDegradationFault comment for why this
    // moved here from the radio-link bucket.
    serviceLayer: { scenario: { faults: [cableDegradationFault(TRIGGERED_IN_PAST_SEC)] } },
  },
  expiredLease: {
    label: "Expired lease",
    serviceLayer: { scenario: { faults: [expiredLeaseFault(TRIGGERED_IN_PAST_SEC)] } },
  },
  doubleNat: {
    label: "Double NAT",
    serviceLayer: { scenario: { faults: [doubleNatFault(TRIGGERED_IN_PAST_SEC)] } },
  },
  customerRouterOffline: {
    label: "Customer router offline",
    serviceLayer: { scenario: { faults: [customerRouterOfflineFault(TRIGGERED_IN_PAST_SEC)] } },
  },
  wrongBootOrder: {
    label: "Wrong boot order",
    // The "radio green, customer down" signature is a scenario-authoring
    // convention (per wrongBootOrderFault's own doc comment): pair the
    // service-layer fault with a low baseUptimeSeconds on the same side.
    local: { baseUptimeSeconds: RECENT_REBOOT_UPTIME_SECONDS },
    serviceLayer: { scenario: { faults: [wrongBootOrderFault(TRIGGERED_IN_PAST_SEC)] } },
  },
};

// Matches today's pre-picker hardcoded demo, so adding the picker doesn't
// change what a first-time visitor to /console sees by default.
export const DEFAULT_SCENARIO: ScenarioKey = "foliageGrowth";
