import { LinkPanel, ServiceLayerPanel } from "@noisefloor/dashboards";
import { ContentFooterLinks } from "../components/ContentFooterLinks";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";
import { useDemoLinkTelemetry } from "../lib/demo-link-telemetry";

export function Console() {
  const { local, remote, serviceLayer } = useDemoLinkTelemetry();

  return (
    <HudPageShell>
      <div className="relative mx-auto flex max-w-[960px] flex-col gap-6">
        <LinkPanel local={local} remote={remote} />
        <ServiceLayerPanel telemetry={serviceLayer} />
        <ContentFooterLinks />
      </div>
      <HudFloorNav />
    </HudPageShell>
  );
}
