import type { Device, World } from "@noisefloor/shared";
import { Gauge } from "../primitives/Gauge.js";

export type LinkHeaderProps = {
  world: World;
};

function DeviceCard({ label, device }: { label: string; device: Device }) {
  return (
    <div className="flex flex-1 flex-col gap-1 rounded-lg border border-foreground p-3 shadow-sm">
      <span className="font-mono text-[11px] text-muted">{label}</span>
      <span className="font-semibold">{device.model}</span>
      <span className="font-mono text-xs text-muted">{device.mode}</span>
      {device.mac && <span className="font-mono text-xs text-muted">{device.mac}</span>}
      {device.txPowerDbm !== undefined && <span className="font-mono text-xs text-muted">{device.txPowerDbm} dBm TX</span>}
    </div>
  );
}

// Renders NOISEFLOOR-OUTLINE.md §7's radio/LinkHeader: local/remote device
// cards plus link-level throughput/capacity/airtime stats, from a World
// alone — "local" is the CPE and "remote" is the AP, matching Link's own
// signalLocalDbm/signalRemoteDbm convention. Rounded/shadowed cards and the
// Gauge are the dashboard-visual-richness carve-out in
// homepage/DESIGN-NOTES.md, not the site-wide flat/square rule.
export function LinkHeader({ world }: LinkHeaderProps) {
  const { link } = world;

  return (
    <div className="flex flex-col gap-3 border border-foreground p-5 pb-4">
      <div className="flex items-center gap-3">
        <DeviceCard label="Local (CPE)" device={world.cpe} />
        <Gauge value={link.linkPotentialPct} max={100} label="Link potential" color="#3b78c4" />
        <DeviceCard label="Remote (AP)" device={world.ap} />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-foreground pt-3 font-mono text-xs">
        <span>Distance: {link.distanceM} m</span>
        <span>Airtime TX/RX: {link.airtimeTxPct}% / {link.airtimeRxPct}%</span>
        <span>
          Capacity: {link.capacityDownMbps}↓ / {link.capacityUpMbps}↑ Mbps
        </span>
      </div>
    </div>
  );
}
