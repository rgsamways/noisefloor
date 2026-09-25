import { useEffect, useRef, useState } from "react";

const LINE = "#1c2a2e";
const TEXT = "#d7e6e2";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";
const PANEL_BG = "#05070a";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// A fully custom calendar, not a native <input type="date"> — the native
// popup (the actual calendar grid) is an OS-level control with no CSS
// hook at all, not just an unstyled one; it can't be made to match the
// HUD look by any amount of styling. Same reasoning, and same
// outside-click pattern, as Console.tsx's ScenarioPicker replacing a
// native <select> for an identical reason.
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

export function HudDatePicker({ value, onChange, max }: { value: string; onChange: (date: string) => void; max?: string }) {
  const [open, setOpen] = useState(false);
  const [viewedMonth, setViewedMonth] = useState(() => startOfMonth(parseLocalDate(value)));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function toggleOpen() {
    if (!open) setViewedMonth(startOfMonth(parseLocalDate(value)));
    setOpen((wasOpen) => !wasOpen);
  }

  function selectDay(date: Date) {
    onChange(formatLocalDate(date));
    setOpen(false);
  }

  const maxDate = max ? parseLocalDate(max) : null;
  const gridStart = new Date(viewedMonth);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="border bg-transparent px-2 py-1 text-[13px] outline-none"
        style={{ borderColor: LINE, color: TEXT }}
      >
        {value}
      </button>

      {open && (
        <div
          className="absolute top-full right-0 z-10 mt-1 w-64 border p-3 text-[13px]"
          style={{ borderColor: LINE, background: PANEL_BG }}
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewedMonth((m) => addMonths(m, -1))}
              aria-label="Previous month"
              className="px-1"
              style={{ color: MUTED }}
            >
              ‹
            </button>
            <span style={{ color: TEXT }}>{viewedMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
            <button
              type="button"
              onClick={() => setViewedMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
              className="px-1"
              style={{ color: MUTED }}
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center" style={{ color: MUTED }}>
            {WEEKDAYS.map((day) => (
              <span key={day} className="py-1 text-[11px]">
                {day}
              </span>
            ))}
            {days.map((day) => {
              const dateStr = formatLocalDate(day);
              const inMonth = day.getMonth() === viewedMonth.getMonth();
              const selected = dateStr === value;
              const disabled = maxDate ? day > maxDate : false;
              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(day)}
                  className="py-1 text-[12px] disabled:opacity-30"
                  style={{
                    color: selected ? "#05070a" : inMonth ? TEXT : MUTED,
                    background: selected ? ACCENT : "transparent",
                  }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => selectDay(new Date())}
            className="mt-2 w-full border-t pt-2 text-[12px]"
            style={{ borderColor: LINE, color: ACCENT }}
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}
