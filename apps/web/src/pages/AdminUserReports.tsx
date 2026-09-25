import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";
import { apiFetch } from "../lib/api";

const LINE = "#1c2a2e";
const TEXT = "#d7e6e2";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";
const BODY = "#9fb3af";

type Report = {
  id: string;
  reportDate: string;
  userEmail: string;
  tickets: string;
  devicesRefurbished: string;
  packages: string;
  calls: string;
  other: string;
};

const FIELDS: Array<{ key: keyof Omit<Report, "id" | "reportDate" | "userEmail">; label: string }> = [
  { key: "tickets", label: "Tickets worked on" },
  { key: "devicesRefurbished", label: "Devices refurbished" },
  { key: "packages", label: "Packages mailed/accepted" },
  { key: "calls", label: "Calls made to customers" },
  { key: "other", label: "Other" },
];

export function AdminUserReports() {
  const { userId } = useParams<{ userId: string }>();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    apiFetch<Report[]>(`/api/admin/eod-reports/${userId}`).then(setReports, (err) => setError(err.message));
  }, [userId]);

  return (
    <HudPageShell>
      <div className="relative mx-auto flex max-w-[720px] flex-col gap-6">
        <div>
          <Link to="/admin" className="text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
            Admin
          </Link>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight">
            Filed reports{reports && reports[0] ? ` — ${reports[0].userEmail}` : ""}
          </h1>
        </div>

        {error && <p className="text-[12px] text-red-400">{error}</p>}

        {reports === null ? (
          <p className="text-[13px]" style={{ color: MUTED }}>
            Loading…
          </p>
        ) : reports.length === 0 ? (
          <p className="text-[13px]" style={{ color: MUTED }}>
            No reports filed yet.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {reports.map((report) => (
              <section key={report.id} className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
                <h2 className="mb-3 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
                  {report.reportDate}
                </h2>
                <div className="flex flex-col gap-3">
                  {FIELDS.map(({ key, label }) => (
                    <div key={key} className="flex flex-col gap-1 text-[13px]">
                      <span style={{ color: BODY }}>{label}</span>
                      <p style={{ color: TEXT }}>{report[key] || "—"}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
      <HudFloorNav />
    </HudPageShell>
  );
}
