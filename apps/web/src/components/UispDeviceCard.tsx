import { useEffect, useState } from "react";
import { Activity, Fingerprint, Gauge, RefreshCw, Signal } from "lucide-react";
import { apiFetch } from "../lib/api";
import { StatCard } from "./GenieAcsDeviceCard";

const LINE = "#1c2a2e";
const TEXT = "#d7e6e2";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";
const BODY = "#9fb3af";

type UispDeviceDetail = {
  id?: string;
  name?: string;
  model?: string;
  status?: string;
  frequency?: number;
  channelWidth?: number;
  signal?: number;
  signal2?: number;
  transmitPower?: number;
  transmitEirp?: number;
  uptimeSeconds?: number;
  cpu?: number;
  ram?: number;
  raw: unknown;
};

function formatUptime(seconds: number | undefined): string {
  if (seconds === undefined) return "—";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Mirrors GenieAcsDeviceCard's structure (add-customer-snapshot task
// 6.3) — same self-contained fetch/loading/error/raw-toggle shape, but
// UISP reports its own status string directly (no derived
// online/offline threshold) and has radio readings instead of TR-069
// lifecycle timestamps, so the sections underneath differ.
export function UispDeviceCard({ deviceId, titlePrefix }: { deviceId: string; titlePrefix?: string }) {
  const [detail, setDetail] = useState<UispDeviceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRaw, setShowRaw] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    apiFetch<UispDeviceDetail>(`/api/uisp/devices/${encodeURIComponent(deviceId)}`).then(
      (data) => {
        setDetail(data);
        setLoading(false);
      },
      (err) => {
        setError(err instanceof Error ? err.message : "failed to load device");
        setLoading(false);
      },
    );
  }

  useEffect(load, [deviceId]);

  const active = detail?.status?.toLowerCase() === "active";

  return (
    <div className="flex flex-col gap-4">
      {titlePrefix && (
        <h3 className="text-[15px] font-semibold tracking-tight" style={{ color: TEXT }}>
          {titlePrefix}
          {detail?.name ? ` — ${detail.name}` : ""}
        </h3>
      )}

      {loading && (
        <p className="text-[13px]" style={{ color: MUTED }}>
          Loading…
        </p>
      )}

      {error && <p className="text-[13px] text-red-400">{error}</p>}

      {detail && (
        <>
          <section
            className="flex items-center justify-between border p-5"
            style={{
              borderColor: active ? ACCENT : LINE,
              background: active ? "rgba(61,255,196,0.06)" : "rgba(255,255,255,0.015)",
              boxShadow: active ? `0 0 24px ${ACCENT}22` : undefined,
            }}
          >
            <div className="flex items-center gap-4">
              <span className="relative flex h-4 w-4 items-center justify-center">
                {active && <span className="absolute h-full w-full animate-ping rounded-full" style={{ background: `${ACCENT}66` }} />}
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: active ? ACCENT : MUTED }} />
              </span>
              <div>
                <div className="text-[20px] font-semibold tracking-tight uppercase" style={{ color: active ? ACCENT : MUTED }}>
                  {detail.status ?? "unknown"}
                </div>
                <div className="text-[12px]" style={{ color: MUTED }}>
                  Uptime {formatUptime(detail.uptimeSeconds)}
                </div>
              </div>
            </div>
            <button type="button" onClick={load} className="flex items-center gap-1.5 border px-3 py-2 text-[12px]" style={{ borderColor: LINE, color: MUTED }}>
              <RefreshCw size={13} />
              Refresh
            </button>
          </section>

          <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
            <h2 className="mb-3 flex items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
              <Fingerprint size={12} />
              Identity
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard icon={Fingerprint} label="Name" value={detail.name ?? "—"} />
              <StatCard icon={Fingerprint} label="Model" value={detail.model ?? "—"} />
              <StatCard icon={Fingerprint} label="Device ID" value={detail.id ?? deviceId} />
            </div>
          </section>

          <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
            <h2 className="mb-3 flex items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
              <Signal size={12} />
              Radio
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard icon={Signal} label="Signal" value={detail.signal !== undefined ? `${detail.signal} dBm` : "—"} />
              {detail.signal2 !== undefined && <StatCard icon={Signal} label="Signal (chain 2)" value={`${detail.signal2} dBm`} />}
              <StatCard icon={Gauge} label="Frequency" value={detail.frequency !== undefined ? `${detail.frequency} MHz` : "—"} />
              <StatCard icon={Gauge} label="Channel width" value={detail.channelWidth !== undefined ? `${detail.channelWidth} MHz` : "—"} />
              <StatCard icon={Gauge} label="TX power" value={detail.transmitPower !== undefined ? `${detail.transmitPower} dBm` : "—"} />
              {detail.transmitEirp !== undefined && <StatCard icon={Gauge} label="TX EIRP" value={`${detail.transmitEirp} dBm`} />}
            </div>
          </section>

          <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
            <h2 className="mb-3 flex items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
              <Activity size={12} />
              System
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard icon={Activity} label="CPU" value={detail.cpu !== undefined ? `${detail.cpu}%` : "—"} />
              <StatCard icon={Activity} label="RAM" value={detail.ram !== undefined ? `${detail.ram}%` : "—"} />
            </div>
          </section>

          <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
            <button type="button" onClick={() => setShowRaw((was) => !was)} className="text-[12px]" style={{ color: MUTED }}>
              {showRaw ? "Hide" : "Show"} raw device record
            </button>
            {showRaw && (
              <pre className="mt-3 max-h-[420px] overflow-auto border p-3 text-[11px] leading-relaxed" style={{ borderColor: LINE, background: "#05070a", color: BODY }}>
                {JSON.stringify(detail.raw, null, 2)}
              </pre>
            )}
          </section>
        </>
      )}
    </div>
  );
}
