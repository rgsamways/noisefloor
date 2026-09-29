import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { LinkPanel, ServiceLayerPanel } from "@noisefloor/dashboards";
import { Link, useNavigate } from "react-router";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";
import { apiFetch } from "../lib/api";
import { useDemoLinkTelemetry } from "../lib/demo-link-telemetry";
import { SCENARIOS, DEFAULT_SCENARIO, type ScenarioKey } from "../lib/console-scenarios";

const LINE = "#1c2a2e";
const TEXT = "#d7e6e2";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";
const PANEL_BG = "#05070a";

const SCENARIO_OPTIONS = Object.entries(SCENARIOS) as [ScenarioKey, (typeof SCENARIOS)[ScenarioKey]][];

// A fully custom listbox, not a native <select> — the native popup's list
// styling is mostly browser/OS-controlled and can't be made to match the
// HUD look. Simplified combobox pattern: focus stays on the toggle button
// while open, keyboard input is handled there rather than via roving
// tabindex in the list. Moved here from the former public /console page —
// the radio console now lives only behind Tickets (add-signin-hub follow-up).
function ScenarioPicker({ value, onChange }: { value: ScenarioKey; onChange: (key: ScenarioKey) => void }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => SCENARIO_OPTIONS.findIndex(([key]) => key === value));
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function commit(index: number) {
    const option = SCENARIO_OPTIONS[index];
    if (!option) return;
    onChange(option[0]);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveIndex(SCENARIO_OPTIONS.findIndex(([key]) => key === value));
        setOpen(true);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, SCENARIO_OPTIONS.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(activeIndex);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-3 border p-3 text-[11px] tracking-[0.08em] uppercase"
      style={{ borderColor: LINE, color: MUTED }}
    >
      <span>Scenario</span>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        onKeyDown={handleKeyDown}
        className="flex flex-1 items-center justify-between border bg-transparent px-2 py-1.5 text-[13px] normal-case tracking-normal"
        style={{ borderColor: LINE, color: TEXT }}
      >
        <span>{SCENARIOS[value].label}</span>
        <span
          aria-hidden="true"
          className="transition-transform"
          style={{ color: ACCENT, transform: open ? "rotate(180deg)" : undefined }}
        >
          ▾
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute top-full left-0 z-10 mt-1 max-h-64 w-full overflow-auto border text-[13px] normal-case tracking-normal"
          style={{ borderColor: LINE, background: PANEL_BG }}
        >
          {SCENARIO_OPTIONS.map(([key, definition], index) => {
            const selected = key === value;
            return (
              <li
                key={key}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(index)}
                className="cursor-pointer px-3 py-2"
                style={{
                  color: selected ? ACCENT : TEXT,
                  background: index === activeIndex ? "rgba(61,255,196,0.08)" : "transparent",
                }}
              >
                {definition.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RadioConsoleSection() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>(DEFAULT_SCENARIO);
  const { local, remote, serviceLayer } = useDemoLinkTelemetry(scenarioKey);

  return (
    <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
      <h2 className="mb-3 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
        Radio console
      </h2>
      <div className="flex flex-col gap-4">
        <ScenarioPicker value={scenarioKey} onChange={setScenarioKey} />
        <LinkPanel local={local} remote={remote} />
        <ServiceLayerPanel telemetry={serviceLayer} />
      </div>
    </section>
  );
}

// Raw device-ID lookup only — no customer-to-device mapping exists yet
// (docs/genieacs-portal-plan.md prerequisite #2), so this is a door into
// GenieACS for now, not a full ticket workflow. Submitting navigates to
// the full device-detail screen (DeviceDetail.tsx) rather than showing a
// status line inline — that screen does its own fetch of the richer
// GET /api/genieacs/devices/:deviceId, so there's nothing to look up here.
function GenieAcsSection() {
  const [deviceId, setDeviceId] = useState("");
  const navigate = useNavigate();

  function lookup() {
    const trimmed = deviceId.trim();
    if (!trimmed) return;
    navigate(`/tickets/devices/${encodeURIComponent(trimmed)}`);
  }

  return (
    <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
      <h2 className="mb-3 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
        GenieACS device status
      </h2>

      <div className="flex gap-2">
        <input
          type="text"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookup()}
          placeholder="GenieACS device ID…"
          className="flex-1 border bg-transparent px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: LINE, color: TEXT }}
        />
        <button
          type="button"
          onClick={lookup}
          disabled={!deviceId.trim()}
          className="border px-3 py-2 text-[13px] disabled:opacity-40"
          style={{ borderColor: ACCENT, color: ACCENT }}
        >
          Look up
        </button>
      </div>
    </section>
  );
}

type CustomerSnapshotData = {
  customer: { id: string; name: string; contactEmail: string | null; contactPhone: string | null };
  sites: Array<{ id: string; address: string; deviceTags: unknown[] }>;
};

// Resolves a customer name/address/device ID to their whole setup
// (add-customer-snapshot task 6.1) — kept alongside, not replacing, the
// raw GenieACS device-ID lookup below: this is the new "I don't have a
// device ID, I have a customer" path.
function CustomerSearchSection() {
  const [term, setTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [noMatch, setNoMatch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function search() {
    const trimmed = term.trim();
    if (!trimmed) return;
    setSearching(true);
    setNoMatch(false);
    setError(null);
    try {
      const result = await apiFetch<CustomerSnapshotData>(`/api/customers/search?term=${encodeURIComponent(trimmed)}`);
      if (!result.customer) {
        setNoMatch(true);
        return;
      }
      navigate(`/tickets/customers/${result.customer.id}`, { state: result });
    } catch (err) {
      setError(err instanceof Error ? err.message : "search failed");
    } finally {
      setSearching(false);
    }
  }

  return (
    <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
      <h2 className="mb-3 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
        Customer search
      </h2>

      <div className="flex gap-2">
        <input
          type="text"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setNoMatch(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Customer name, site address, or device ID…"
          className="flex-1 border bg-transparent px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: LINE, color: TEXT }}
        />
        <button
          type="button"
          onClick={search}
          disabled={searching || !term.trim()}
          className="border px-3 py-2 text-[13px] disabled:opacity-40"
          style={{ borderColor: ACCENT, color: ACCENT }}
        >
          Search
        </button>
      </div>

      {noMatch && (
        <p className="mt-3 text-[12px]" style={{ color: MUTED }}>
          No customer found for "{term.trim()}".
        </p>
      )}
      {error && <p className="mt-3 text-[12px] text-red-400">{error}</p>}
    </section>
  );
}

export function Tickets() {
  return (
    <HudPageShell>
      <div className="relative mx-auto flex max-w-[960px] flex-col gap-6">
        <div>
          <Link to="/hub" className="block text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
            Support
          </Link>
          <h1 className="mt-3 text-[32px] font-semibold tracking-tight">Tickets</h1>
        </div>

        <RadioConsoleSection />
        <CustomerSearchSection />
        <GenieAcsSection />
      </div>
      <HudFloorNav />
    </HudPageShell>
  );
}
