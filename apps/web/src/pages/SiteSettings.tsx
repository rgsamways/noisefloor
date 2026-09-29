import { useEffect, useState } from "react";
import { Link } from "react-router";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";
import { apiFetch } from "../lib/api";

const LINE = "#1c2a2e";
const TEXT = "#d7e6e2";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";

type Settings = { eodReportMode: "freeform" | "structured" };

function SettingsSection() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reload() {
    apiFetch<Settings>("/api/admin/settings").then(setSettings, (err) => setError(err.message));
  }

  useEffect(reload, []);

  async function setMode(eodReportMode: Settings["eodReportMode"]) {
    setSaving(true);
    setError(null);
    try {
      const updated = await apiFetch<Settings>("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ eodReportMode }),
      });
      setSettings(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to update settings");
      reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
      <h2 className="mb-3 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
        Settings
      </h2>

      {error && <p className="mb-3 text-[12px] text-red-400">{error}</p>}

      <div className="flex items-center justify-between text-[13px]">
        <span style={{ color: TEXT }}>End of day report format</span>
        <div className="flex gap-2">
          {(["freeform", "structured"] as const).map((option) => {
            const active = settings?.eodReportMode === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                disabled={saving || !settings}
                className="border px-2 py-1 text-[12px] capitalize disabled:opacity-40"
                style={{ borderColor: active ? ACCENT : LINE, color: active ? ACCENT : MUTED }}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function SiteSettings() {
  return (
    <HudPageShell>
      <div className="relative mx-auto flex max-w-[960px] flex-col gap-6">
        <div>
          <Link to="/hub" className="block text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
            Admin
          </Link>
          <h1 className="mt-3 text-[32px] font-semibold tracking-tight">Site settings</h1>
        </div>

        <SettingsSection />
      </div>
      <HudFloorNav />
    </HudPageShell>
  );
}
