import type { ServiceLayerTelemetry } from "@noisefloor/console-schema";
import { HudFrame } from "../primitives/HudFrame.js";
import { SEVERITY_COLORS, type Severity } from "./severity.js";

export type ServiceLayerPanelProps = {
  telemetry: ServiceLayerTelemetry;
};

const LINE = "#1c2a2e";
const TEXT = "#d7e6e2";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";

const SEVERITY_LABEL: Record<Severity, string> = {
  good: "GOOD",
  ok: "FAIR",
  warn: "DEGRADED",
  bad: "CRITICAL",
};

// A different judgment shape than the radio link's linkQualityPct-driven
// severity.ts scale: these fields are categorical/boolean, not a
// continuous percentage, so severity comes from which conditions are
// true rather than a threshold. lanPort down and no active lease are both
// "customer can't get online" states (bad); double NAT still passes
// traffic, just degrades it (warn); a LAN port that's up but below its
// healthy negotiated speed or showing CRC errors is also degraded (warn),
// distinct from fully down (bad) — the "cable degradation" fault's
// signature. 1000 Mbps is this panel's own healthy-speed reference, kept
// independent of simulation-engine's default rather than importing it —
// dashboards has no dependency on simulation-engine.
export function serviceLayerSeverity(telemetry: ServiceLayerTelemetry): Severity {
  if (!telemetry.lanPort.linkUp.value || !telemetry.dhcpLease.present.value) return "bad";
  if (telemetry.nat.upstreamPresent.value && telemetry.nat.customerSidePresent.value) return "warn";
  if (telemetry.lanPort.linkSpeedMbps.value < 1000 || telemetry.lanPort.crcErrorCount.value > 0) return "warn";
  return "good";
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between text-[11px]" style={{ color: MUTED }}>
      <span>{label}</span>
      <span style={{ color: color ?? TEXT }}>{value}</span>
    </div>
  );
}

// The service-layer half of "two panels, not one" — DHCP/NAT/addressing/LAN
// port state, judged separately from the radio link above it (design.md's
// framing: a bad reading here isn't a radio problem, and the console
// should be able to say so). Single set of readings, not LOCAL/REMOTE
// columns like LinkPanel — this describes the customer-side service layer,
// not two ends of a link.
export function ServiceLayerPanel({ telemetry }: ServiceLayerPanelProps) {
  const severity = serviceLayerSeverity(telemetry);
  const color = SEVERITY_COLORS[severity];
  const leaseMismatch = telemetry.dhcpLease.leaseAddress.value !== telemetry.dhcpLease.expectedAddress.value;

  return (
    <HudFrame>
      <div
        className="mb-4.5 flex flex-col gap-1 border-b pb-3.5 text-sm md:flex-row md:items-baseline md:justify-between"
        style={{ borderColor: LINE }}
      >
        <div className="flex items-center gap-1.5 whitespace-nowrap" style={{ color: TEXT }}>
          <span
            className="inline-block h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full"
            style={{ background: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }}
          />
          SERVICE · <b style={{ color: ACCENT }}>CPE-2231</b>
        </div>
        <span
          className="w-fit rounded-[3px] px-1.5 py-px text-[9px] tracking-[0.05em]"
          style={{ color, background: `${color}1f` }}
        >
          {SEVERITY_LABEL[severity]}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
          <div
            className="mb-2.5 border-b border-dashed pb-1.5 text-[10px] tracking-[0.12em] uppercase"
            style={{ borderColor: LINE, color: ACCENT }}
          >
            DHCP &amp; NAT
          </div>
          <div className="flex flex-col gap-1.5">
            <Row
              label="Lease"
              value={telemetry.dhcpLease.present.value ? "Active" : "Expired"}
              color={telemetry.dhcpLease.present.value ? undefined : SEVERITY_COLORS.bad}
            />
            <Row
              label="Address"
              value={telemetry.dhcpLease.leaseAddress.value}
              color={leaseMismatch ? SEVERITY_COLORS.bad : undefined}
            />
            <Row
              label="Renews in"
              value={
                telemetry.dhcpLease.present.value ? formatDuration(telemetry.dhcpLease.remainingSeconds.value) : "—"
              }
            />
            <Row label="Customer-side NAT" value={telemetry.nat.customerSidePresent.value ? "Yes" : "No"} />
            <Row
              label="Upstream NAT"
              value={telemetry.nat.upstreamPresent.value ? "Yes" : "No"}
              color={telemetry.nat.upstreamPresent.value ? SEVERITY_COLORS.warn : undefined}
            />
          </div>
        </div>

        <div className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
          <div
            className="mb-2.5 border-b border-dashed pb-1.5 text-[10px] tracking-[0.12em] uppercase"
            style={{ borderColor: LINE, color: ACCENT }}
          >
            Addressing &amp; port
          </div>
          <div className="flex flex-col gap-1.5">
            <Row label="Management IP" value={telemetry.addressing.managementIp.value} />
            <Row label="Gateway" value={telemetry.addressing.gateway.value} />
            <Row label="WAN address" value={telemetry.addressing.wanAddress.value} />
            <Row
              label="LAN port"
              value={telemetry.lanPort.linkUp.value ? "Up" : "Down"}
              color={telemetry.lanPort.linkUp.value ? undefined : SEVERITY_COLORS.bad}
            />
            <Row
              label="Link speed"
              value={`${telemetry.lanPort.linkSpeedMbps.value} Mbps`}
              color={telemetry.lanPort.linkSpeedMbps.value < 1000 ? SEVERITY_COLORS.warn : undefined}
            />
            <Row label="Duplex" value={telemetry.lanPort.duplex.value === "full" ? "Full" : "Half"} />
            <Row
              label="CRC errors"
              value={String(telemetry.lanPort.crcErrorCount.value)}
              color={telemetry.lanPort.crcErrorCount.value > 0 ? SEVERITY_COLORS.warn : undefined}
            />
          </div>
        </div>
      </div>
    </HudFrame>
  );
}
