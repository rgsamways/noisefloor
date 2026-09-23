import { LinkPanel } from "@noisefloor/dashboards";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";
import { useDemoLinkTelemetry } from "../lib/demo-link-telemetry";

export function Console() {
  const { local, remote } = useDemoLinkTelemetry();

  return (
    <HudPageShell>
      <div className="relative mx-auto max-w-[960px]">
        <LinkPanel local={local} remote={remote} />
      </div>
      <HudFloorNav />
    </HudPageShell>
  );
}
