import { BookOpen, Home, Radio } from "lucide-react";
import { Link, useLocation } from "react-router";

const NAV_ITEMS = [
  { to: "/", label: "Home", Icon: Home, match: (pathname: string) => pathname === "/" },
  { to: "/console", label: "Console", Icon: Radio, match: (pathname: string) => pathname === "/console" },
  { to: "/kb", label: "KB", Icon: BookOpen, match: (pathname: string) => pathname.startsWith("/kb") },
] as const;

const LINE = "#1c2a2e";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";

// "The floor" for the HUD pages — see homepage/homepage-laptop.html/-phone.html
// and docs/mockups/noisefloor-mock-kb-index.html for the design this makes
// real. A separate component from BottomNav.tsx on purpose: that one still
// serves the light-themed, auth-gated pages that haven't moved to the HUD
// shell yet (/cases). No "Me" item here — account access is a top-strip
// concern on the homepage (the Welcome link), not this nav's job
// (openspec/changes/hud-shell-nav design.md).
export function HudFloorNav() {
  const { pathname } = useLocation();

  return (
    <footer
      className="fixed inset-x-0 bottom-0 h-[72px] border-t md:h-16"
      style={{ borderColor: LINE, background: "rgba(5,7,10,0.92)", fontFamily: '"JetBrains Mono", monospace' }}
    >
      <div className="mx-auto flex h-full items-center px-3 md:px-[72px]">
        <div className="hidden items-center gap-2 text-[11px] tracking-[0.05em] md:flex md:w-40" style={{ color: MUTED }}>
          <span className="inline-block h-px w-2" style={{ background: MUTED }} aria-hidden="true" />
          <span>−104 dBm</span>
        </div>

        <nav
          aria-label="Primary"
          className="grid h-16 flex-1 grid-cols-3 items-end gap-0 md:mx-auto md:flex md:flex-none md:gap-14"
        >
          {NAV_ITEMS.map(({ to, label, Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className="flex h-16 flex-col items-center justify-end gap-1.5 pb-1.5 md:pb-3"
                style={{
                  color: active ? ACCENT : MUTED,
                  transform: active ? "translateY(-6px)" : undefined,
                  filter: active ? `drop-shadow(0 0 5px ${ACCENT}99)` : undefined,
                }}
              >
                <Icon size={20} strokeWidth={2} aria-hidden="true" />
                <span className="text-[11px] md:text-xs">{label}</span>
                <span
                  className="block h-0.5 w-7 md:w-full"
                  style={{ background: active ? ACCENT : "transparent", boxShadow: active ? `0 0 6px ${ACCENT}99` : "none" }}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden text-[11px] tracking-[0.05em] md:block md:w-40 md:text-right" style={{ color: MUTED }}>
          the floor
        </div>
      </div>
    </footer>
  );
}
