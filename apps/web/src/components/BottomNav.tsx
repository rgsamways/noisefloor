import { BookOpen, Home, TriangleAlert } from "lucide-react";
import { Link, useLocation } from "react-router";

const NAV_ITEMS = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/cases", label: "Cases", Icon: BookOpen },
  { to: "/gotchas", label: "Gotchas", Icon: TriangleAlert },
] as const;

// "The floor" — persistent bottom nav, per homepage/DESIGN-NOTES.md. One
// component covers both layouts: the laptop/phone mockups share the same
// items and icons, only spacing, the two side captions, and the
// grid-vs-flex arrangement differ, all expressible as breakpoint classes.
// No "Me" item — reaching /me is via the Welcome message link instead.
export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <footer className="fixed inset-x-0 bottom-0 h-[72px] border-t border-foreground bg-background md:h-16">
      <div className="mx-auto flex h-full items-center px-3 md:px-[72px]">
        <div className="hidden items-center gap-2 font-mono text-[11px] text-muted md:flex md:w-40">
          <span className="inline-block h-px w-2 bg-muted" aria-hidden="true" />
          <span>−104 dBm</span>
        </div>

        <nav
          aria-label="Primary"
          className="grid h-16 flex-1 grid-cols-3 items-end gap-0 md:mx-auto md:flex md:flex-none md:gap-14"
        >
          {NAV_ITEMS.map(({ to, label, Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={`flex h-16 flex-col items-center justify-end gap-1.5 pb-1.5 md:pb-3 ${
                  active ? "-translate-y-1.5 text-foreground md:-translate-y-2" : "text-muted"
                }`}
              >
                <Icon size={20} strokeWidth={2} aria-hidden="true" />
                <span className="font-mono text-[11px] md:text-xs">{label}</span>
                <span
                  className={`block h-0.5 w-7 md:w-full ${active ? "bg-foreground" : "bg-transparent"}`}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden font-mono text-[11px] text-muted md:block md:w-40 md:text-right">the floor</div>
      </div>
    </footer>
  );
}
