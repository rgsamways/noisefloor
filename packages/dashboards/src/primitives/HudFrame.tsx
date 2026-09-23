import type { ReactNode } from "react";

const LINE = "#1c2a2e";
const ACCENT = "#3dffc4";

// The bordered frame + glowing corner brackets shared by every console
// instrument — extracted from LinkPanel once ServiceLayerPanel needed the
// identical shell, same "second consumer" reasoning as HudPageShell and
// useDemoLinkTelemetry elsewhere in this project.
export function HudFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative border p-6"
      style={{
        borderColor: LINE,
        background: "linear-gradient(180deg, rgba(255,255,255,0.015), transparent 30%), rgba(6,10,12,0.55)",
        borderRadius: 4,
      }}
    >
      {(["tl", "tr", "bl", "br"] as const).map((corner) => (
        <span
          key={corner}
          className="pointer-events-none absolute h-3.5 w-3.5"
          style={{
            borderColor: ACCENT,
            opacity: 0.6,
            top: corner.startsWith("t") ? -1 : undefined,
            bottom: corner.startsWith("b") ? -1 : undefined,
            left: corner.endsWith("l") ? -1 : undefined,
            right: corner.endsWith("r") ? -1 : undefined,
            borderTopWidth: corner.startsWith("t") ? 1 : 0,
            borderBottomWidth: corner.startsWith("b") ? 1 : 0,
            borderLeftWidth: corner.endsWith("l") ? 1 : 0,
            borderRightWidth: corner.endsWith("r") ? 1 : 0,
            borderStyle: "solid",
          }}
        />
      ))}
      {children}
    </div>
  );
}
