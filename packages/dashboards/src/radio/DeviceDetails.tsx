import type { World } from "@noisefloor/shared";
import { LinearMeter } from "../primitives/LinearMeter.js";

export type DeviceDetailsProps = {
  world: World;
  side: "local" | "remote";
};

// Vendor UI threshold, not a world-consistency-validator rule — see
// design.md in openspec/changes/radio-family-case-001-stages-2-3 for why
// this lives here rather than in validator/constants.ts. Interpolated, not
// independently confirmed against a real vendor spec.
const CABLE_SNR_RED_BELOW_DB = 30;
const CABLE_SNR_METER_MAX_DB = 40;
const CINR_METER_MAX_DB = 35;
const MEMORY_WARM_ABOVE_PCT = 70;

// Renders NOISEFLOOR-OUTLINE.md §7's radio/DeviceDetails: device
// mode/firmware/uptime/memory/CPU, wireless (CINR/distance/noise floor),
// and ethernet (cable SNR — flagged red below vendor threshold per the
// cable-snr-threshold gotcha — cable length, LAN speed if set). GPS only
// renders when the device reports satellites (AP-only in practice).
// Memory/CPU as bars (not flat text), and a separate "wireless mode"
// (Station/Access Point — derivable from `side`, distinct from the
// router/bridge "network mode") were both added after comparing directly
// against a real UISP device panel screenshot Robin shared — this
// component was missing them entirely, not just under-styled. Rounded/
// shadowed card is the dashboard-visual-richness carve-out in
// homepage/DESIGN-NOTES.md.
export function DeviceDetails({ world, side }: DeviceDetailsProps) {
  const device = side === "local" ? world.cpe : world.ap;
  const cinrDb = side === "local" ? world.link.cinrLocalDb : world.link.cinrRemoteDb;
  const noiseFloorDbm = side === "local" ? world.link.noiseFloorLocalDbm : world.link.noiseFloorRemoteDbm;
  const cableSnrIsRed = device.cableSnrDb < CABLE_SNR_RED_BELOW_DB;
  const memoryIsWarm = device.memoryPct > MEMORY_WARM_ABOVE_PCT;
  const wirelessMode = side === "local" ? "Station PtMP" : "Access Point PtMP";

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-foreground p-5 pb-4 font-mono text-xs shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">{device.model}</span>
        <span className="text-muted">{side === "local" ? "Local (CPE)" : "Remote (AP)"}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <span>Network mode: {device.mode}</span>
        <span>Firmware: {device.firmware}</span>
        <span>Wireless mode: {wirelessMode}</span>
        <span>Uptime: {device.uptimeHours} h</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LinearMeter
          value={device.memoryPct}
          min={0}
          max={100}
          label="Memory"
          color={memoryIsWarm ? "#e5484d" : "#3b78c4"}
        />
        <LinearMeter value={device.cpuPct} min={0} max={100} label="CPU" color="#3b78c4" />
      </div>

      <div className="flex flex-col gap-2 border-t border-foreground pt-2">
        <div className="text-muted">Wireless</div>
        <LinearMeter value={cinrDb} min={0} max={CINR_METER_MAX_DB} label="CINR (dB)" color="#3b78c4" />
        <div className="grid grid-cols-2 gap-2">
          <span>Distance: {world.link.distanceM} m</span>
          <span>Noise floor: {noiseFloorDbm} dBm</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-foreground pt-2">
        <div className="text-muted">Ethernet</div>
        <LinearMeter
          value={device.cableSnrDb}
          min={0}
          max={CABLE_SNR_METER_MAX_DB}
          label={`Cable SNR (dB)${cableSnrIsRed ? " — marginal" : ""}`}
          color={cableSnrIsRed ? "#e5484d" : "#2bb673"}
        />
        <div className="grid grid-cols-2 gap-2">
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
