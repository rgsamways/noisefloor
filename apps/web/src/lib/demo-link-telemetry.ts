import { useEffect, useMemo, useState } from "react";
import type { RadioLinkTelemetry, ServiceLayerTelemetry } from "@noisefloor/console-schema";
import {
  simulateRadioLink,
  simulateServiceLayer,
  foliageGrowthFault,
  type SimulationConfig,
  type ServiceLayerConfig,
} from "@noisefloor/simulation-engine";

const TICK_MS = 1000;

// Hardcoded demo scenario — no fault/scenario picker exists yet (deferred,
// see openspec/changes/radio-console-ui). LOCAL stays healthy throughout;
// REMOTE runs foliageGrowthFault triggered far in the past with a short
// ramp so it's already fully plateaued at "warn" severity before the page
// ever loads. This targets linkHealth directly, which is what the column
// severity badge is judged on. Two faults were deliberately NOT used here:
// rainFadeFault always recovers (would drift REMOTE back to healthy
// mid-demo); cableDegradationFault only steps chainImbalanceDb (confirmed
// during radio-fault-library's review), so it widens the chain-meter gap
// but never moves linkQualityPct or the severity badge — verified by
// actually looking at the rendered page, not assumed from the fault name.
function useDemoConfigs(
  baseTimeIso: string,
): { local: SimulationConfig; remote: SimulationConfig; serviceLayer: ServiceLayerConfig } {
  return useMemo(
    () => ({
      local: {
        linkProfile: { distanceKm: 3.1, band: "5.8GHz", gearClass: "sector" },
        seed: "console-demo-local",
        baseTimeIso,
      },
      remote: {
        linkProfile: { distanceKm: 3.1, band: "5.8GHz", gearClass: "cpe" },
        seed: "console-demo-remote",
        baseTimeIso,
        scenario: { faults: [foliageGrowthFault(-1_000_000, { rampSec: 100 })] },
      },
      // Deliberately fault-free: the radio link demo is already degraded
      // (REMOTE), so a healthy service layer here teaches the "two panels,
      // judged independently" point the homepage's own copy makes — a
      // degraded radio link doesn't automatically mean the service layer
      // is broken too.
      serviceLayer: { baseTimeIso },
    }),
    [baseTimeIso],
  );
}

// Shared demo scenario + 1 Hz live-tick, used by both /console and the
// homepage's hero visual — extracted from Console.tsx once Landing.tsx
// needed the identical thing (openspec/changes/homepage-conversion), same
// "second consumer" reasoning that justified extracting HudPageShell.
// serviceLayer is a later addition (service-layer-panel change) that only
// Console.tsx consumes — Landing.tsx's hero stays radio-link-only by
// choice, not an oversight.
export function useDemoLinkTelemetry(): {
  local: RadioLinkTelemetry;
  remote: RadioLinkTelemetry;
  serviceLayer: ServiceLayerTelemetry;
} {
  const [baseTimeIso] = useState(() => new Date().toISOString());
  const [atSec, setAtSec] = useState(0);
  const configs = useDemoConfigs(baseTimeIso);

  useEffect(() => {
    const id = setInterval(() => setAtSec((s) => s + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  return {
    local: simulateRadioLink(configs.local, atSec),
    remote: simulateRadioLink(configs.remote, atSec),
    serviceLayer: simulateServiceLayer(configs.serviceLayer, atSec),
  };
}
