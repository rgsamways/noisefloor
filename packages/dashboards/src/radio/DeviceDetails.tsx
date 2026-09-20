import type { World } from "@noisefloor/shared";

export type DeviceDetailsProps = {
  world: World;
  side: "local" | "remote";
};

// Vendor UI threshold, not a world-consistency-validator rule — see
// design.md in openspec/changes/radio-family-case-001-stages-2-3 for why
// this lives here rather than in validator/constants.ts. Interpolated, not
// independently confirmed against a real vendor spec.
const CABLE_SNR_RED_BELOW_DB = 30;

// Renders NOISEFLOOR-OUTLINE.md §7's radio/DeviceDetails: device
// mode/firmware/uptime/memory/CPU, wireless (CINR/distance/noise floor),
// and ethernet (cable SNR — flagged red below vendor threshold per the
// cable-snr-threshold gotcha — cable length, LAN speed if set). GPS only
// renders when the device reports satellites (AP-only in practice).
export function DeviceDetails({ world, side }: DeviceDetailsProps) {
  const device = side === "local" ? world.cpe : world.ap;
  const cinrDb = side === "local" ? world.link.cinrLocalDb : world.link.cinrRemoteDb;
  const noiseFloorDbm = side === "local" ? world.link.noiseFloorLocalDbm : world.link.noiseFloorRemoteDbm;
  const cableSnrIsRed = device.cableSnrDb < CABLE_SNR_RED_BELOW_DB;

  return (
    <div className="flex flex-col gap-3 border border-foreground p-5 pb-4 font-mono text-xs">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">{device.model}</span>
        <span className="text-muted">{side === "local" ? "Local (CPE)" : "Remote (AP)"}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <span>Mode: {device.mode}</span>
        <span>Firmware: {device.firmware}</span>
        <span>Uptime: {device.uptimeHours} h</span>
        <span>Memory: {device.memoryPct}%</span>
        <span>CPU: {device.cpuPct}%</span>
      </div>

      <div className="border-t border-foreground pt-2">
        <div className="mb-1 text-muted">Wireless</div>
        <div className="grid grid-cols-2 gap-2">
          <span>CINR: {cinrDb} dB</span>
          <span>Distance: {world.link.distanceM} m</span>
          <span>Noise floor: {noiseFloorDbm} dBm</span>
        </div>
      </div>

      <div className="border-t border-foreground pt-2">
        <div className="mb-1 text-muted">Ethernet</div>
        <div className="grid grid-cols-2 gap-2">
          <span className={cableSnrIsRed ? "font-semibold text-red-700" : undefined}>
            Cable SNR: {device.cableSnrDb} dB{cableSnrIsRed ? " (marginal)" : ""}
          </span>
          <span>Cable length: {device.cableLengthM} m</span>
          {device.lanSpeedMbps !== undefined && <span>LAN: {device.lanSpeedMbps} Mbps</span>}
        </div>
      </div>

      {device.gpsSatellites !== undefined && (
        <div className="border-t border-foreground pt-2">
          <span className="text-muted">GPS: </span>
          <span>{device.gpsSatellites} satellites</span>
        </div>
      )}
    </div>
  );
}
