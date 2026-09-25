import { useEffect, useState } from "react";
import { HudDatePicker } from "../components/HudDatePicker";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";
import { apiFetch } from "../lib/api";
import { authClient } from "../lib/auth-client";

const LINE = "#1c2a2e";
const TEXT = "#d7e6e2";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";
const BODY = "#9fb3af";

type Mode = "freeform" | "structured";

type FreeformFields = { tickets: string; devicesRefurbished: string; packages: string; calls: string };
type TicketRow = { ticketNumber: string; customer: string; summary: string; status: string };
type DeviceRow = { deviceType: string; serialId: string; notes: string };
type PackageRow = { direction: string; description: string; tracking: string };
type ContactRow = { customer: string; method: string; contact: string; reason: string; outcome: string };

type Report = {
  reportDate: string;
  mode: Mode;
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

const EMPTY_FREEFORM: FreeformFields = { tickets: "", devicesRefurbished: "", packages: "", calls: "" };
const EMPTY_TICKET_ROW: TicketRow = { ticketNumber: "", customer: "", summary: "", status: "Resolved" };
const EMPTY_DEVICE_ROW: DeviceRow = { deviceType: "", serialId: "", notes: "" };
const EMPTY_PACKAGE_ROW: PackageRow = { direction: "accepted", description: "", tracking: "" };
const EMPTY_CONTACT_ROW: ContactRow = { customer: "", method: "phone", contact: "", reason: "", outcome: "" };

const FREEFORM_FIELDS: Array<{ key: keyof FreeformFields; label: string }> = [
  { key: "tickets", label: "Tickets worked on" },
  { key: "devicesRefurbished", label: "Devices refurbished" },
  { key: "packages", label: "Packages mailed/accepted" },
  { key: "calls", label: "Customer contacts" },
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

// A small set of fixed choices rendered as toggle buttons, not a native
// <select> — the native dropdown list is an OS-level control with no CSS
// hook (same reasoning HudDatePicker and Console.tsx's ScenarioPicker
// already applied), and a 2-3 option choice doesn't need a full custom
// listbox component on top of that.
function Segmented({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          disabled={disabled}
          className="border px-1.5 py-1 text-[11px] whitespace-nowrap disabled:opacity-40"
          style={{ borderColor: value === opt.value ? ACCENT : LINE, color: value === opt.value ? ACCENT : MUTED }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

type ColumnDef<T> =
  | { key: keyof T; label: string; type: "text" }
  | { key: keyof T; label: string; type: "segmented"; options: Array<{ value: string; label: string }> };

function EditableTable<T>({
  columns,
  rows,
  onChange,
  onAdd,
  onRemove,
  disabled,
}: {
  columns: Array<ColumnDef<T>>;
  rows: T[];
  onChange: (index: number, key: keyof T, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <table className="w-full text-left text-[12px]">
        <thead>
          <tr style={{ color: MUTED }}>
            {columns.map((c) => (
              <th key={String(c.key)} className="border-b pb-1 pr-2 font-normal" style={{ borderColor: LINE }}>
                {c.label}
              </th>
            ))}
            <th className="border-b pb-1" style={{ borderColor: LINE }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((c) => (
                <td key={String(c.key)} className="border-b py-1 pr-2" style={{ borderColor: LINE, verticalAlign: "top" }}>
                  {c.type === "segmented" ? (
                    <Segmented
                      value={String(row[c.key])}
                      options={c.options}
                      onChange={(v) => onChange(index, c.key, v)}
                      disabled={disabled}
                    />
                  ) : (
                    <input
                      type="text"
                      value={String(row[c.key])}
                      onChange={(e) => onChange(index, c.key, e.target.value)}
                      disabled={disabled}
                      className="w-full border bg-transparent px-1.5 py-1 text-[12px] outline-none disabled:opacity-40"
                      style={{ borderColor: LINE, color: TEXT }}
                    />
                  )}
                </td>
              ))}
              <td className="border-b py-1" style={{ borderColor: LINE, verticalAlign: "top" }}>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  disabled={disabled}
                  aria-label="Remove row"
                  className="disabled:opacity-40"
                  style={{ color: MUTED }}
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="w-fit border px-2 py-1 text-[12px] disabled:opacity-40"
        style={{ borderColor: LINE, color: ACCENT }}
      >
        + Add row
      </button>
    </div>
  );
}

function updateRow<T>(setRows: React.Dispatch<React.SetStateAction<T[]>>, index: number, key: keyof T, value: string) {
  setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
}

export function Me() {
  const { data: session } = authClient.useSession();
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

  const [date, setDate] = useState(todayLocal());
  const [mode, setMode] = useState<Mode>("freeform");
  const [fields, setFields] = useState(EMPTY_FREEFORM);
  const [other, setOther] = useState("");
  const [ticketRows, setTicketRows] = useState<TicketRow[]>([]);
  const [deviceRows, setDeviceRows] = useState<DeviceRow[]>([]);
  const [packageRows, setPackageRows] = useState<PackageRow[]>([]);
  const [contactRows, setContactRows] = useState<ContactRow[]>([]);
  const [recent, setRecent] = useState<Report[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function reloadRecent() {
    apiFetch<Report[]>("/api/eod-reports").then(setRecent, () => setRecent([]));
  }

  useEffect(reloadRecent, []);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);

    async function load() {
      try {
        const report = await fetchReportForDate(apiUrl, date);
        // The site's current mode is only fetched when actually needed —
        // a brand-new date with no existing report — and fetched fresh at
        // that moment, not from separately-fetched state. Reading it from
        // a `siteMode` state set by its own independent effect raced
        // against this effect on first mount: if this one resolved first,
        // it read that state's still-default "freeform" instead of
        // whatever had actually just loaded, so a fresh report could
        // silently get created in the wrong mode even right after a
        // siteAdmin switched the site to structured.
        const resolvedMode = report?.mode ?? (await apiFetch<{ mode: Mode }>("/api/eod-report-mode")).mode;
        if (cancelled) return;

        setMode(resolvedMode);
        setFields(
          report
            ? { tickets: report.tickets, devicesRefurbished: report.devicesRefurbished, packages: report.packages, calls: report.calls }
            : EMPTY_FREEFORM,
        );
        setOther(report?.other ?? "");
        setTicketRows(report?.ticketRows ?? []);
        setDeviceRows(report?.deviceRows ?? []);
        setPackageRows(report?.packageRows ?? []);
        setContactRows(report?.contactRows ?? []);
        setStatus("idle");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "failed to load report");
        setStatus("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [date, apiUrl]);

  async function save() {
    setStatus("saving");
    setError(null);
    try {
      const body =
        mode === "freeform" ? { ...fields, other } : { ticketRows, deviceRows, packageRows, contactRows, other };
      await apiFetch(`/api/eod-reports/${date}`, { method: "PUT", body: JSON.stringify(body) });
      setStatus("saved");
      reloadRecent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to save report");
      setStatus("error");
    }
  }

  return (
    <HudPageShell>
      <div className="relative mx-auto flex max-w-[960px] flex-col gap-6">
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
            <HudDatePicker value={date} onChange={setDate} max={todayLocal()} />
          </div>

          {mode === "freeform" ? (
            <div className="flex flex-col gap-3">
              {FREEFORM_FIELDS.map(({ key, label }) => (
                <label key={key} className="flex flex-col gap-1 text-[13px]" style={{ color: BODY }}>
                  {label}
                  <textarea
                    value={fields[key]}
                    onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
                    rows={2}
                    disabled={status === "loading"}
                    className="w-full border bg-transparent px-3 py-2 text-[13px] outline-none disabled:opacity-40"
                    style={{ borderColor: LINE, color: TEXT }}
                  />
                </label>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <span className="text-[13px]" style={{ color: BODY }}>
                  Tickets worked on
                </span>
                <EditableTable
                  columns={[
                    { key: "ticketNumber", label: "Ticket #", type: "text" },
                    { key: "customer", label: "Customer", type: "text" },
                    { key: "summary", label: "Summary", type: "text" },
                    {
                      key: "status",
                      label: "Status",
                      type: "segmented",
                      options: [
                        { value: "Resolved", label: "Resolved" },
                        { value: "Follow-up needed", label: "Follow-up" },
                      ],
                    },
                  ]}
                  rows={ticketRows}
                  onChange={(i, k, v) => updateRow(setTicketRows, i, k, v)}
                  onAdd={() => setTicketRows((prev) => [...prev, { ...EMPTY_TICKET_ROW }])}
                  onRemove={(i) => setTicketRows((prev) => prev.filter((_, idx) => idx !== i))}
                  disabled={status === "loading"}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[13px]" style={{ color: BODY }}>
                  Devices refurbished
                </span>
                <EditableTable
                  columns={[
                    { key: "deviceType", label: "Device type", type: "text" },
                    { key: "serialId", label: "Serial/ID", type: "text" },
                    { key: "notes", label: "Notes", type: "text" },
                  ]}
                  rows={deviceRows}
                  onChange={(i, k, v) => updateRow(setDeviceRows, i, k, v)}
                  onAdd={() => setDeviceRows((prev) => [...prev, { ...EMPTY_DEVICE_ROW }])}
                  onRemove={(i) => setDeviceRows((prev) => prev.filter((_, idx) => idx !== i))}
                  disabled={status === "loading"}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[13px]" style={{ color: BODY }}>
                  Packages mailed/accepted
                </span>
                <EditableTable
                  columns={[
                    {
                      key: "direction",
                      label: "Direction",
                      type: "segmented",
                      options: [
                        { value: "mailed", label: "Mailed" },
                        { value: "accepted", label: "Accepted" },
                      ],
                    },
                    { key: "description", label: "Description", type: "text" },
                    { key: "tracking", label: "Tracking #", type: "text" },
                  ]}
                  rows={packageRows}
                  onChange={(i, k, v) => updateRow(setPackageRows, i, k, v)}
                  onAdd={() => setPackageRows((prev) => [...prev, { ...EMPTY_PACKAGE_ROW }])}
                  onRemove={(i) => setPackageRows((prev) => prev.filter((_, idx) => idx !== i))}
                  disabled={status === "loading"}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[13px]" style={{ color: BODY }}>
                  Customer contacts
                </span>
                <EditableTable
                  columns={[
                    { key: "customer", label: "Customer", type: "text" },
                    {
                      key: "method",
                      label: "Method",
                      type: "segmented",
                      options: [
                        { value: "phone", label: "Phone" },
                        { value: "email", label: "Email" },
                      ],
                    },
                    { key: "contact", label: "Phone/Email", type: "text" },
                    { key: "reason", label: "Reason", type: "text" },
                    { key: "outcome", label: "Outcome", type: "text" },
                  ]}
                  rows={contactRows}
                  onChange={(i, k, v) => updateRow(setContactRows, i, k, v)}
                  onAdd={() => setContactRows((prev) => [...prev, { ...EMPTY_CONTACT_ROW }])}
                  onRemove={(i) => setContactRows((prev) => prev.filter((_, idx) => idx !== i))}
                  disabled={status === "loading"}
                />
              </div>
            </div>
          )}

          <label className="mt-4 flex flex-col gap-1 text-[13px]" style={{ color: BODY }}>
            Other
            <textarea
              value={other}
              onChange={(e) => setOther(e.target.value)}
              rows={2}
              disabled={status === "loading"}
              className="w-full border bg-transparent px-3 py-2 text-[13px] outline-none disabled:opacity-40"
              style={{ borderColor: LINE, color: TEXT }}
            />
          </label>

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
            on in the "Tickets worked on" {mode === "freeform" ? "field" : "table"} above.
          </p>
        </section>
      </div>
      <HudFloorNav />
    </HudPageShell>
  );
}
