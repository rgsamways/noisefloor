import { useEffect, useMemo, useState } from "react";
import type { RadioLinkTelemetry, ServiceLayerTelemetry } from "@noisefloor/console-schema";
import {
  simulateRadioLink,
  simulateServiceLayer,
  type SimulationConfig,
  type ServiceLayerConfig,
} from "@noisefloor/simulation-engine";
import { SCENARIOS, DEFAULT_SCENARIO, type ScenarioKey } from "./console-scenarios.js";

const TICK_MS = 1000;

// LOCAL/REMOTE follows real T1 practice, not a fixed tower-vs-customer
// split: LOCAL is whichever radio you're logged into, and T1 more commonly
// logs into the customer's (CPE) radio — so LOCAL = CPE and REMOTE =
// Sector here. Base config below is scenario-agnostic (distance/band/gear/
// seed); which fault (if any) is active comes from console-scenarios.ts,
// keyed by scenarioKey, and is merged on top per side.
function useDemoConfigs(
  baseTimeIso: string,
  scenarioKey: ScenarioKey,
): { local: SimulationConfig; remote: SimulationConfig; serviceLayer: ServiceLayerConfig } {
  return useMemo(() => {
    const scenario = SCENARIOS[scenarioKey];
    return {
      local: {
        linkProfile: { distanceKm: 3.1, band: "5.8GHz", gearClass: "cpe" },
        seed: "console-demo-local",
        baseTimeIso,
        ...scenario.local,
      },
      remote: {
        linkProfile: { distanceKm: 3.1, band: "5.8GHz", gearClass: "sector" },
        seed: "console-demo-remote",
        baseTimeIso,
        ...scenario.remote,
      },
      serviceLayer: { baseTimeIso, ...scenario.serviceLayer },
    };
  }, [baseTimeIso, scenarioKey]);
}

// Shared demo scenario + 1 Hz live-tick, used by both /console and the
// homepage's hero visual — extracted from Console.tsx once Landing.tsx
// needed the identical thing (openspec/changes/homepage-conversion), same
// "second consumer" reasoning that justified extracting HudPageShell.
// serviceLayer is a later addition (service-layer-panel change) that only
// Console.tsx consumes — Landing.tsx's hero stays radio-link-only by
// choice, not an oversight. `scenarioKey` defaults to the same scenario
// this hook always showed before the picker existed (openspec/changes/
// console-scenario-picker), so Landing.tsx's no-argument call site is
// unaffected — only Console.tsx passes a visitor-selected key.
export function useDemoLinkTelemetry(scenarioKey: ScenarioKey = DEFAULT_SCENARIO): {
  local: RadioLinkTelemetry;
  remote: RadioLinkTelemetry;
  serviceLayer: ServiceLayerTelemetry;
} {
  const [baseTimeIso] = useState(() => new Date().toISOString());
  const [atSec, setAtSec] = useState(0);
  const configs = useDemoConfigs(baseTimeIso, scenarioKey);

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
