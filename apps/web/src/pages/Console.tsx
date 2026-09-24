import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { LinkPanel, ServiceLayerPanel } from "@noisefloor/dashboards";
import { ContentFooterLinks } from "../components/ContentFooterLinks";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";
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
// HUD look (confirmed: it rendered as a plain white list). Simplified
// combobox pattern: focus stays on the toggle button while open, keyboard
// input is handled there rather than via roving tabindex in the list.
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

export function Console() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>(DEFAULT_SCENARIO);
  const { local, remote, serviceLayer } = useDemoLinkTelemetry(scenarioKey);

  return (
    <HudPageShell>
      <div className="relative mx-auto flex max-w-[960px] flex-col gap-6">
        <ScenarioPicker value={scenarioKey} onChange={setScenarioKey} />
        <LinkPanel local={local} remote={remote} />
        <ServiceLayerPanel telemetry={serviceLayer} />
        <ContentFooterLinks />
      </div>
      <HudFloorNav />
    </HudPageShell>
  );
}
