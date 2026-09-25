import { useEffect, useState } from "react";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";
import { apiFetch } from "../lib/api";
import { authClient } from "../lib/auth-client";

const LINE = "#1c2a2e";
const TEXT = "#d7e6e2";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";
const BODY = "#9fb3af";

type Report = { reportDate: string; tickets: string; devicesRefurbished: string; packages: string; calls: string; other: string };

const EMPTY_FIELDS = { tickets: "", devicesRefurbished: "", packages: "", calls: "", other: "" };

const FIELDS: Array<{ key: keyof typeof EMPTY_FIELDS; label: string }> = [
  { key: "tickets", label: "Tickets worked on" },
  { key: "devicesRefurbished", label: "Devices refurbished" },
  { key: "packages", label: "Packages mailed/accepted" },
  { key: "calls", label: "Calls made to customers" },
  { key: "other", label: "Other" },
];

function todayLocal(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

// apiFetch throws on any non-2xx response, but a 404 here just means
// "no report filed for this date yet" — an expected outcome, not a
// failure — so this bypasses apiFetch's throw-on-404 behavior rather
// than using try/catch to distinguish "not found" from a real error.
async function fetchReportForDate(apiUrl: string, date: string): Promise<Report | null> {
  const response = await fetch(`${apiUrl}/api/eod-reports/${date}`, { credentials: "include" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`failed to load report for ${date}`);
  return response.json() as Promise<Report>;
}

export function Me() {
  const { data: session } = authClient.useSession();
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

  const [date, setDate] = useState(todayLocal());
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [recent, setRecent] = useState<Report[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function reloadRecent() {
    apiFetch<Report[]>("/api/eod-reports").then(setRecent, () => setRecent([]));
  }

  useEffect(reloadRecent, []);

  useEffect(() => {
    setStatus("loading");
    setError(null);
    fetchReportForDate(apiUrl, date).then(
      (report) => {
        setFields(report ?? EMPTY_FIELDS);
        setStatus("idle");
      },
      (err) => {
        setError(err instanceof Error ? err.message : "failed to load report");
        setStatus("error");
      },
    );
  }, [date, apiUrl]);

  async function save() {
    setStatus("saving");
    setError(null);
    try {
      await apiFetch(`/api/eod-reports/${date}`, { method: "PUT", body: JSON.stringify(fields) });
      setStatus("saved");
      reloadRecent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to save report");
      setStatus("error");
    }
  }

  return (
    <HudPageShell>
      <div className="relative mx-auto flex max-w-[720px] flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
              Account
            </div>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight">Signed in as {session?.user.email}</h1>
          </div>
          <button
            type="button"
            onClick={() => authClient.signOut()}
            className="border px-3 py-2 text-[13px]"
            style={{ borderColor: LINE, color: MUTED }}
          >
            Sign out
          </button>
        </div>

        <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
              End of day report
            </h2>
            <input
              type="date"
              value={date}
              max={todayLocal()}
              onChange={(e) => setDate(e.target.value)}
              className="border bg-transparent px-2 py-1 text-[13px] outline-none"
              style={{ borderColor: LINE, color: TEXT }}
            />
          </div>

          <div className="flex flex-col gap-3">
            {FIELDS.map(({ key, label }) => (
              <label key={key} className="flex flex-col gap-1 text-[13px]" style={{ color: BODY }}>
                {label}
                <textarea
                  value={fields[key]}
                  onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
                  rows={2}
                  className="w-full border bg-transparent px-3 py-2 text-[13px] outline-none"
                  style={{ borderColor: LINE, color: TEXT }}
                />
              </label>
            ))}
          </div>

          {error && <p className="mt-3 text-[12px] text-red-400">{error}</p>}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={status === "saving" || status === "loading"}
              className="border px-3 py-2 text-[13px] disabled:opacity-40"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              {status === "saving" ? "Saving…" : "Save"}
            </button>
            {status === "saved" && <span className="text-[12px]" style={{ color: MUTED }}>Saved.</span>}
          </div>

          {recent && recent.length > 0 && (
            <div className="mt-5 flex flex-col gap-2 border-t pt-4" style={{ borderColor: LINE }}>
              <p className="text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
                Recent reports
              </p>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => {
                  const active = date === r.reportDate;
                  return (
                    <button
                      key={r.reportDate}
                      type="button"
                      onClick={() => setDate(r.reportDate)}
                      className="border px-2 py-1 text-[12px]"
                      style={{ borderColor: active ? ACCENT : LINE, color: active ? ACCENT : MUTED }}
                    >
                      {r.reportDate}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
          <h2 className="mb-3 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
            Tickets
          </h2>
          <p className="text-[13px] leading-relaxed" style={{ color: BODY }}>
            Ticket history will live here once noisefloor can connect to real customer radios. For now, mention any tickets you worked
            on in the "Tickets worked on" field above.
          </p>
        </section>
      </div>
      <HudFloorNav />
    </HudPageShell>
  );
}
