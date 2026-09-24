import { useEffect, useRef, useState } from "react";
import type { RadioLinkTelemetry } from "@noisefloor/console-schema";
import { Gauge } from "../primitives/Gauge.js";
import { HudFrame } from "../primitives/HudFrame.js";
import { LinearMeter } from "../primitives/LinearMeter.js";
import { SegmentBar } from "../primitives/SegmentBar.js";
import { LineTrace, type LineTraceDatum } from "../primitives/LineTrace.js";
import { SEVERITY_COLORS, linkQualityToSeverity, type Severity } from "./severity.js";

export type LinkPanelProps = {
  local: RadioLinkTelemetry;
  remote: RadioLinkTelemetry;
};

const LINE = "#1c2a2e";
const TEXT = "#d7e6e2";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";
const ACCENT2 = "#7c9bff";
const MODULATION_STEPS = 9; // matches simulation-engine's 0-9 modulationIndex range
const HISTORY_LENGTH = 40;

const SEVERITY_LABEL: Record<Severity, string> = {
  good: "GOOD",
  ok: "FAIR",
  warn: "DEGRADED",
  bad: "CRITICAL",
};

// Splits the schema's single chainImbalanceDb into two displayable
// per-chain readings, symmetric around the overall signal — the schema
// only carries the imbalance (the diagnostically meaningful number), not
// two independently-measured chain values. A display-layer convenience,
// not a new data contract.
function splitChains(signalDbm: number, chainImbalanceDb: number): [number, number] {
  return [signalDbm + chainImbalanceDb / 2, signalDbm - chainImbalanceDb / 2];
}

function useSignalHistory(signalDbm: number): LineTraceDatum[] {
  const [history, setHistory] = useState<LineTraceDatum[]>([]);
  const tick = useRef(0);

  useEffect(() => {
    tick.current += 1;
    setHistory((prev) => [...prev, { t: String(tick.current), v: signalDbm }].slice(-HISTORY_LENGTH));
  }, [signalDbm]);

  return history;
}

function Column({ label, sublabel, telemetry }: { label: string; sublabel: string; telemetry: RadioLinkTelemetry }) {
  const { link } = telemetry;
  const severity = linkQualityToSeverity(link.linkQualityPct.value);
  const color = SEVERITY_COLORS[severity];
  const [chain1, chain2] = splitChains(link.signalDbm.value, link.chainImbalanceDb.value);
  const history = useSignalHistory(link.signalDbm.value);

  return (
    <div className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
      <div
        className="mb-2.5 flex items-center justify-between border-b border-dashed pb-1.5 text-[10px] tracking-[0.12em] uppercase"
        style={{ borderColor: LINE, color: ACCENT }}
      >
        <span>
          {label} · {sublabel}
        </span>
        <span
          className="rounded-[3px] px-1.5 py-px text-[9px] tracking-[0.05em]"
          style={{ color, background: `${color}1f` }}
        >
          {SEVERITY_LABEL[severity]}
        </span>
      </div>

      <div className="text-[26px] font-semibold" style={{ color: TEXT }}>
        {Math.round(link.signalDbm.value)} dBm
      </div>

      <div className="mt-2 flex justify-between text-[11px]" style={{ color: MUTED }}>
        <span>Noise floor</span>
        <span>{Math.round(link.noiseFloorDbm.value)} dBm</span>
      </div>
      <div className="mt-1 flex justify-between text-[11px]" style={{ color: MUTED }}>
        <span>SNR</span>
        <span>{Math.round(link.snrDb.value)} dB</span>
      </div>

      <div className="mt-2">
        <LinearMeter
          value={Math.round(chain1)}
          min={-100}
          max={-30}
          label="Chain 1"
          color={color}
          trackColor="#0f1a1c"
          square
          labelClassName="flex items-baseline justify-between font-mono text-[11px]"
          valueClassName="font-semibold"
        />
      </div>
      <div className="mt-2">
        <LinearMeter
          value={Math.round(chain2)}
          min={-100}
          max={-30}
          label="Chain 2"
          color={color}
          trackColor="#0f1a1c"
          square
          labelClassName="flex items-baseline justify-between font-mono text-[11px]"
          valueClassName="font-semibold"
        />
      </div>

      <div className="mt-2.5 flex justify-between text-[11px]" style={{ color: MUTED }}>
        <span>Modulation</span>
        <span>MCS {link.modulationIndex.value}</span>
      </div>
      <div className="mt-1.5 mb-2.5">
        <SegmentBar
          filledCount={link.modulationIndex.value}
          totalCount={MODULATION_STEPS}
          filledColor={color}
          borderColor={`border-[${LINE}]`}
          square
        />
      </div>

      <div className="h-11 border" style={{ borderColor: LINE, background: "#050b0c" }}>
        <LineTrace data={history} height={44} minValue={-100} maxValue={-30} color={color} fill />
      </div>
    </div>
  );
}

// The composed HUD instrument matching docs/mockups/noisefloor-mock-hybrid.html
// — frame + corner brackets, the link-quality gauge, LOCAL/REMOTE columns,
// legend, footer. No page background/orbs and no route/live-tick logic;
// those live in the apps/web page that mounts this, so LinkPanel stays a
// reusable instrument. Severity is judged per-column (one color for every
// reading in a column), not per-field — see design.md's Risks for why.
export function LinkPanel({ local, remote }: LinkPanelProps) {
  const gaugeValue = local.link.linkQualityPct.value;

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
          LINK · <b style={{ color: ACCENT }}>CPE-2231</b>&nbsp;↔&nbsp;<b style={{ color: ACCENT }}>SECTOR-04A</b>
        </div>
        <div className="text-[10px] tracking-[0.08em]" style={{ color: MUTED }}>
          {local.farEnd.distanceKm.value} KM · {(local.link.frequencyMhz.value / 1000).toFixed(1)} GHZ · PTMP
        </div>
      </div>

      <div className="mb-6 flex justify-center">
        <Gauge
          value={Math.round(gaugeValue)}
          max={100}
          label="LINK QUALITY %"
          gradient={[ACCENT, ACCENT2]}
          glow
          trackColor="#0f1a1c"
          size={96}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Column label="Local" sublabel="CPE" telemetry={local} />
        <Column label="Remote" sublabel="Sector Radio" telemetry={remote} />
      </div>

      <div className="mt-4.5 flex flex-wrap justify-center gap-4 text-[9px] tracking-[0.08em]" style={{ color: MUTED }}>
        {(["bad", "warn", "ok", "good"] as const).map((sev) => (
          <span key={sev} className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: SEVERITY_COLORS[sev] }} />
            {SEVERITY_LABEL[sev].toLowerCase()}
          </span>
        ))}
      </div>

      <div
        className="mt-5 flex justify-between border-t pt-3.5 text-[10px] tracking-[0.04em]"
        style={{ borderColor: LINE, color: MUTED }}
      >
        <div>
          CPU <b style={{ color: TEXT }}>{Math.round(local.radioHealth.cpuPct.value)}%</b> · RAM{" "}
          <b style={{ color: TEXT }}>{Math.round(local.radioHealth.ramPct.value)}%</b> · UPTIME{" "}
          <b style={{ color: TEXT }}>{formatUptime(local.radioHealth.uptimeSeconds.value)}</b>
        </div>
      </div>
    </HudFrame>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}
