import type { ReactNode } from "react";

// The dark-HUD page background (near-black canvas, two blurred gradient
// orbs, JetBrains Mono) shared by every public HUD page — extracted from
// apps/web/src/pages/Console.tsx, which was the only consumer until /kb
// (openspec/changes/knowledge-base). Background/orbs/font only: it does
// NOT render HudFloorNav or any max-width content wrapper — those stay
// each page's own concern, matching hud-shell-nav's decision that
// HudFloorNav is a standalone element a page places directly, not part of
// a shared layout wrapper.
export function HudPageShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden p-6 pb-[88px] md:pb-20"
      style={{ background: "#05070a", fontFamily: '"JetBrains Mono", monospace', color: "#d7e6e2" }}
    >
      <div
        className="pointer-events-none absolute -top-36 -left-30 h-[420px] w-[420px] rounded-full opacity-35 blur-[90px]"
        style={{ background: "#3dffc4" }}
      />
      <div
        className="pointer-events-none absolute -right-16 -bottom-30 h-[360px] w-[360px] rounded-full opacity-35 blur-[90px]"
        style={{ background: "#7c9bff" }}
      />
      {children}
    </div>
  );
}
