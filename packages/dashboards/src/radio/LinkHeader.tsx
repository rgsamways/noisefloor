import type { Device, World } from "@noisefloor/shared";

export type LinkHeaderProps = {
  world: World;
};

function DeviceCard({ label, device }: { label: string; device: Device }) {
  return (
    <div className="flex flex-1 flex-col gap-1 border border-foreground p-3">
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
// signalLocalDbm/signalRemoteDbm convention.
export function LinkHeader({ world }: LinkHeaderProps) {
  const { link } = world;

  return (
    <div className="flex flex-col gap-3 border border-foreground p-5 pb-4">
      <div className="flex gap-3">
        <DeviceCard label="Local (CPE)" device={world.cpe} />
        <DeviceCard label="Remote (AP)" device={world.ap} />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-foreground pt-3 font-mono text-xs">
        <span>Distance: {link.distanceM} m</span>
        <span>Link potential: {link.linkPotentialPct}%</span>
        <span>Airtime TX/RX: {link.airtimeTxPct}% / {link.airtimeRxPct}%</span>
        <span>
          Capacity: {link.capacityDownMbps}↓ / {link.capacityUpMbps}↑ Mbps
        </span>
      </div>
    </div>
  );
}
