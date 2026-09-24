import { useState } from "react";
import { LinkPanel, ServiceLayerPanel } from "@noisefloor/dashboards";
import { ContentFooterLinks } from "../components/ContentFooterLinks";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";
import { useDemoLinkTelemetry } from "../lib/demo-link-telemetry";
import { SCENARIOS, DEFAULT_SCENARIO, type ScenarioKey } from "../lib/console-scenarios";

const LINE = "#1c2a2e";
const TEXT = "#d7e6e2";
const MUTED = "#5a726e";

const SCENARIO_OPTIONS = Object.entries(SCENARIOS) as [ScenarioKey, (typeof SCENARIOS)[ScenarioKey]][];

function ScenarioPicker({ value, onChange }: { value: ScenarioKey; onChange: (key: ScenarioKey) => void }) {
  return (
    <label
      className="flex items-center gap-3 border p-3 text-[11px] tracking-[0.08em] uppercase"
      style={{ borderColor: LINE, color: MUTED }}
    >
      Scenario
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as ScenarioKey)}
        className="flex-1 border bg-transparent px-2 py-1.5 text-[13px] normal-case tracking-normal"
        style={{ borderColor: LINE, color: TEXT, colorScheme: "dark" }}
      >
        {SCENARIO_OPTIONS.map(([key, definition]) => (
          <option key={key} value={key}>
            {definition.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Console() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>(DEFAULT_SCENARIO);
  const { local, remote, serviceLayer } = useDemoLinkTelemetry(scenarioKey);

  return (
    <HudPageShell>
      <div className="relative mx-auto flex max-w-[960px] flex-col gap-6">
        <ScenarioPicker value={scenarioKey} onChange={setScenarioKey} />
        <LinkPanel local={local} remote={remote} />
        <ServiceLayerPanel telemetry={serviceLayer} />
        <ContentFooterLinks />
      </div>
      <HudFloorNav />
    </HudPageShell>
  );
}
