import { useEffect, useState } from "react";
import { Cpu, Fingerprint, History, Link2, Radio, RadioTower, RefreshCw, Settings2 } from "lucide-react";
import { apiFetch } from "../lib/api";

const LINE = "#1c2a2e";
const TEXT = "#d7e6e2";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";
const BODY = "#9fb3af";

type GenieAcsDeviceDetail = {
  id: string;
  status: "online" | "offline";
  lastInform: string;
  manufacturer?: string;
  oui?: string;
  productClass?: string;
  serialNumber?: string;
  hardwareVersion?: string;
  softwareVersion?: string;
  provisioningCode?: string;
  rootDataModelVersion?: string;
  lastBoot?: string;
  lastBootstrap?: string;
  registered?: string;
  periodicInformEnabled?: boolean;
  periodicInformIntervalSeconds?: number;
  connectionRequestUrl?: string;
  raw: unknown;
};

export function formatRelative(iso: string, now: Date): string {
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function StatCard({ icon: Icon, label, value }: { icon: typeof Cpu; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 border p-3" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
      <div className="flex items-center gap-1.5 text-[10px] tracking-[0.08em] uppercase" style={{ color: MUTED }}>
        <Icon size={12} style={{ color: ACCENT }} />
        {label}
      </div>
      <div className="text-[13px]" style={{ color: TEXT }}>
        {value}
      </div>
    </div>
  );
}

export function TimestampRow({ label, iso, now }: { label: string; iso: string | undefined; now: Date }) {
  if (!iso) return null;
  return (
    <div className="flex items-center justify-between border-b py-2 text-[13px] last:border-b-0" style={{ borderColor: LINE }}>
      <span style={{ color: BODY }}>{label}</span>
      <span style={{ color: TEXT }}>
        {formatRelative(iso, now)} <span style={{ color: MUTED }}>· {new Date(iso).toLocaleString()}</span>
      </span>
    </div>
  );
}

// The GenieACS device-detail body — extracted from what was originally
// DeviceDetail.tsx's whole page, so a customer snapshot screen can embed
// the exact same view per genieacs-tagged device instead of just linking
// out to it (add-customer-snapshot task 6.2). DeviceDetail.tsx now wraps
// this in its own page shell/heading; this component owns its own fetch
// and is otherwise self-contained.
export function GenieAcsDeviceCard({
  deviceId,
  titlePrefix,
  onLoaded,
}: {
  deviceId: string;
  titlePrefix?: string;
  onLoaded?: (detail: GenieAcsDeviceDetail) => void;
}) {
  const [detail, setDetail] = useState<GenieAcsDeviceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [showRaw, setShowRaw] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    apiFetch<GenieAcsDeviceDetail>(`/api/genieacs/devices/${encodeURIComponent(deviceId)}`).then(
      (data) => {
        setDetail(data);
        setLoading(false);
        onLoaded?.(data);
      },
      (err) => {
        setError(err instanceof Error ? err.message : "failed to load device");
        setLoading(false);
      },
    );
  }

  useEffect(load, [deviceId]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(interval);
  }, []);

  const online = detail?.status === "online";

  return (
    <div className="flex flex-col gap-4">
      {titlePrefix && (
        <h3 className="text-[15px] font-semibold tracking-tight" style={{ color: TEXT }}>
          {titlePrefix}
          {detail ? ` — ${detail.manufacturer ?? "Unknown"} ${detail.productClass ?? ""}`.trim() : ""}
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
              borderColor: online ? ACCENT : LINE,
              background: online ? "rgba(61,255,196,0.06)" : "rgba(255,255,255,0.015)",
              boxShadow: online ? `0 0 24px ${ACCENT}22` : undefined,
            }}
          >
            <div className="flex items-center gap-4">
              <span className="relative flex h-4 w-4 items-center justify-center">
                {online && <span className="absolute h-full w-full animate-ping rounded-full" style={{ background: `${ACCENT}66` }} />}
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: online ? ACCENT : MUTED }} />
              </span>
              <div>
                <div className="text-[20px] font-semibold tracking-tight uppercase" style={{ color: online ? ACCENT : MUTED }}>
                  {detail.status}
                </div>
                <div className="text-[12px]" style={{ color: MUTED }}>
                  Last inform {formatRelative(detail.lastInform, now)}
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
              <StatCard icon={RadioTower} label="Manufacturer" value={detail.manufacturer ?? "—"} />
              <StatCard icon={Radio} label="Product class" value={detail.productClass ?? "—"} />
              <StatCard icon={Fingerprint} label="Serial number" value={detail.serialNumber ?? "—"} />
              <StatCard icon={Cpu} label="OUI" value={detail.oui ?? "—"} />
              <StatCard icon={Cpu} label="Hardware version" value={detail.hardwareVersion ?? "—"} />
              <StatCard icon={Cpu} label="Software version" value={detail.softwareVersion ?? "—"} />
              {detail.rootDataModelVersion && <StatCard icon={Settings2} label="Data model version" value={detail.rootDataModelVersion} />}
              {detail.provisioningCode !== undefined && detail.provisioningCode !== "" && (
                <StatCard icon={Settings2} label="Provisioning code" value={detail.provisioningCode} />
              )}
            </div>
          </section>

          <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
            <h2 className="mb-3 flex items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
              <History size={12} />
              Lifecycle
            </h2>
            <div className="flex flex-col">
              <TimestampRow label="Last inform" iso={detail.lastInform} now={now} />
              <TimestampRow label="Last boot" iso={detail.lastBoot} now={now} />
              <TimestampRow label="Last bootstrap" iso={detail.lastBootstrap} now={now} />
              <TimestampRow label="Registered" iso={detail.registered} now={now} />
            </div>
          </section>

          <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
            <h2 className="mb-3 flex items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
              <Link2 size={12} />
              Management
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard
                icon={Settings2}
                label="Periodic inform"
                value={detail.periodicInformEnabled === undefined ? "—" : detail.periodicInformEnabled ? "Enabled" : "Disabled"}
              />
              <StatCard
                icon={History}
                label="Inform interval"
                value={detail.periodicInformIntervalSeconds ? `${detail.periodicInformIntervalSeconds}s` : "—"}
              />
            </div>
            {detail.connectionRequestUrl && (
              <p className="mt-3 truncate text-[12px]" style={{ color: MUTED }}>
                Connection request: <span style={{ color: TEXT }}>{detail.connectionRequestUrl}</span>
              </p>
            )}
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
