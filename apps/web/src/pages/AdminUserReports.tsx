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

type TicketRow = { ticketNumber: string; customer: string; summary: string; status: string };
type DeviceRow = { deviceType: string; serialId: string; notes: string };
type PackageRow = { direction: string; description: string; tracking: string };
type ContactRow = { customer: string; method: string; contact: string; reason: string; outcome: string };

type Report = {
  id: string;
  reportDate: string;
  mode: "freeform" | "structured";
  userEmail: string;
  tickets: string;
  devicesRefurbished: string;
  packages: string;
  calls: string;
  other: string;
  ticketRows: TicketRow[] | null;
  deviceRows: DeviceRow[] | null;
  packageRows: PackageRow[] | null;
  contactRows: ContactRow[] | null;
};

const FREEFORM_FIELDS: Array<{ key: keyof Report; label: string }> = [
  { key: "tickets", label: "Tickets worked on" },
  { key: "devicesRefurbished", label: "Devices refurbished" },
  { key: "packages", label: "Packages mailed/accepted" },
  { key: "calls", label: "Customer contacts" },
];

// Read-only, since a siteAdmin browses history here — no per-cell inputs,
// just a table rendering of whatever rows were filed. A siteAdmin may see
// both freeform and structured reports across one user's history, since
// a report's mode is locked in at the moment it was filed and never
// changes later (openspec/changes/archive/add-eod-report-modes design.md's
// Decision 2).
function ReadOnlyTable<T extends object>({ columns, rows }: { columns: Array<{ key: keyof T; label: string }>; rows: T[] }) {
  if (rows.length === 0) return <p className="text-[12px]" style={{ color: MUTED }}>None</p>;
  return (
    <table className="w-full text-left text-[12px]">
      <thead>
        <tr style={{ color: MUTED }}>
          {columns.map((c) => (
            <th key={String(c.key)} className="border-b pb-1 pr-2 font-normal" style={{ borderColor: LINE }}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {columns.map((c) => (
              <td key={String(c.key)} className="border-b py-1 pr-2" style={{ borderColor: LINE, color: TEXT }}>
                {String(row[c.key]) || "—"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

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
      <div className="relative mx-auto flex max-w-[960px] flex-col gap-6">
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
                {report.mode === "freeform" ? (
                  <div className="flex flex-col gap-3">
                    {FREEFORM_FIELDS.map(({ key, label }) => (
                      <div key={String(key)} className="flex flex-col gap-1 text-[13px]">
                        <span style={{ color: BODY }}>{label}</span>
                        <p style={{ color: TEXT }}>{String(report[key]) || "—"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[13px]" style={{ color: BODY }}>
                        Tickets worked on
                      </span>
                      <ReadOnlyTable
                        columns={[
                          { key: "ticketNumber", label: "Ticket #" },
                          { key: "customer", label: "Customer" },
                          { key: "summary", label: "Summary" },
                          { key: "status", label: "Status" },
                        ]}
                        rows={report.ticketRows ?? []}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[13px]" style={{ color: BODY }}>
                        Devices refurbished
                      </span>
                      <ReadOnlyTable
                        columns={[
                          { key: "deviceType", label: "Device type" },
                          { key: "serialId", label: "Serial/ID" },
                          { key: "notes", label: "Notes" },
                        ]}
                        rows={report.deviceRows ?? []}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[13px]" style={{ color: BODY }}>
                        Packages mailed/accepted
                      </span>
                      <ReadOnlyTable
                        columns={[
                          { key: "direction", label: "Direction" },
                          { key: "description", label: "Description" },
                          { key: "tracking", label: "Tracking #" },
                        ]}
                        rows={report.packageRows ?? []}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[13px]" style={{ color: BODY }}>
                        Customer contacts
                      </span>
                      <ReadOnlyTable
                        columns={[
                          { key: "customer", label: "Customer" },
                          { key: "method", label: "Method" },
                          { key: "contact", label: "Phone/Email" },
                          { key: "reason", label: "Reason" },
                          { key: "outcome", label: "Outcome" },
                        ]}
                        rows={report.contactRows ?? []}
                      />
                    </div>
                  </div>
                )}
                <div className="mt-3 flex flex-col gap-1 text-[13px]">
                  <span style={{ color: BODY }}>Other</span>
                  <p style={{ color: TEXT }}>{report.other || "—"}</p>
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
