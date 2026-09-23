import { useEffect, useMemo, useState } from "react";
import { LinkPanel } from "@noisefloor/dashboards";
import { simulateRadioLink, foliageGrowthFault, type SimulationConfig } from "@noisefloor/simulation-engine";
import { HudFloorNav } from "../components/HudFloorNav";

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
function useConsoleConfigs(baseTimeIso: string): { local: SimulationConfig; remote: SimulationConfig } {
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
    }),
    [baseTimeIso],
  );
}

export function Console() {
  const [baseTimeIso] = useState(() => new Date().toISOString());
  const [atSec, setAtSec] = useState(0);
  const configs = useConsoleConfigs(baseTimeIso);

  useEffect(() => {
    const id = setInterval(() => setAtSec((s) => s + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const local = simulateRadioLink(configs.local, atSec);
  const remote = simulateRadioLink(configs.remote, atSec);

  return (
    <div
      className="relative min-h-screen overflow-hidden p-6 pb-[88px] md:pb-20"
      style={{ background: "#05070a", fontFamily: '"JetBrains Mono", monospace', color: "#d7e6e2" }}
    >
      <div
        className="pointer-events-none absolute -top-36 -left-30 h-[420px] w-[420px] rounded-full opacity-35 blur-[90px]"
        style={{ background: "#3dffc4" }}
      />
      <div
        className="pointer-events-none absolute -right-16 -bottom-30 h-[360px] w-[360px] rounded-full opacity-35 blur-[90px]"
        style={{ background: "#7c9bff" }}
      />
      <div className="relative mx-auto max-w-[960px]">
        <LinkPanel local={local} remote={remote} />
      </div>
      <HudFloorNav />
    </div>
  );
}
