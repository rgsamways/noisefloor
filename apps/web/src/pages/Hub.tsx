import { useEffect, useState } from "react";
import { Link } from "react-router";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";
import { apiFetch } from "../lib/api";
import { authClient } from "../lib/auth-client";

const LINE = "#1c2a2e";
const TEXT = "#d7e6e2";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";

type SessionAccess = { siteAdmin: boolean; siteRules: string[]; groupRules: string[] };

type Card = { to: string; title: string; description: string; requiredRules: string[] };

// A small hardcoded table, not a generic catalog-driven system — there
// are only four sections today, and a generic "every feature declares
// its own hub card" mechanism is speculative given how much this exact
// list has already changed (design.md's Decision). A card shows if the
// caller holds ANY of its requiredRules, or is siteAdmin.
const CARDS: Card[] = [
  { to: "/admin/users-and-groups", title: "Users and groups", description: "Manage groups, invitations, and site users.", requiredRules: [] },
  { to: "/admin/settings", title: "Site settings", description: "Site-wide configuration, like the EOD report format.", requiredRules: [] },
  { to: "/admin/customers", title: "Customers", description: "Create customers/sites and tag their GenieACS/UISP devices.", requiredRules: [] },
  {
    to: "/reports",
    title: "Reports",
    description: "File and review end-of-day reports.",
    requiredRules: ["submit_eod_report", "view_own_eod_reports"],
  },
  {
    to: "/tickets",
    title: "Tickets",
    description: "The radio console, plus look up a customer device's status.",
    requiredRules: ["view_device_status"],
  },
];

// Links shown when a signed-in caller has no active group memberships
// and isn't siteAdmin — deliberately not named or coded as "visitor"
// anywhere: this bucket will later include real customers, not just
// today's curious sign-ins, and nothing here should need rewriting when
// that happens (design.md's Decision).
const PUBLIC_LINKS = [
  { to: "/kb", label: "Knowledge base" },
  { to: "/roadmap", label: "Roadmap" },
  { to: "/about", label: "About" },
];

export function Hub() {
  const { data: session } = authClient.useSession();
  const [access, setAccess] = useState<SessionAccess | null>(null);

  useEffect(() => {
    apiFetch<SessionAccess>("/api/session").then(setAccess, () => setAccess({ siteAdmin: false, siteRules: [], groupRules: [] }));
  }, []);

  // Users and Groups / Site Settings have an empty requiredRules —
  // access to those two is siteAdmin-only, not rule-based, so they only
  // ever show for a siteAdmin.
  const cards =
    access === null
      ? []
      : CARDS.filter((card) => {
          if (card.requiredRules.length === 0) return access.siteAdmin;
          return access.siteAdmin || card.requiredRules.some((r) => access.groupRules.includes(r));
        });

  const hasAnyAccess = access !== null && (access.siteAdmin || cards.length > 0);

  return (
    <HudPageShell>
      <div className="relative mx-auto max-w-[960px]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
              Hub
            </div>
            <h1 className="mt-3 text-[32px] font-semibold tracking-tight">Welcome{session ? `, ${session.user.name || session.user.email}` : ""}</h1>
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

        {access === null ? (
          <p className="mt-7 text-[13px]" style={{ color: MUTED }}>
            Loading…
          </p>
        ) : hasAnyAccess ? (
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {cards.map((card) => (
              <Link
                key={card.to}
                to={card.to}
                className="flex flex-col gap-2 border p-4 transition-colors"
                style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = ACCENT)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = LINE)}
              >
                <span className="text-sm font-semibold">{card.title}</span>
                <p className="m-0 text-xs leading-relaxed" style={{ color: "#9fb3af" }}>
                  {card.description}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-7 flex flex-col gap-4">
            <p className="text-[13px] leading-relaxed" style={{ color: TEXT }}>
              Nothing's set up for your account yet. In the meantime, here's what's already available:
            </p>
            <div className="flex flex-wrap gap-2">
              {PUBLIC_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="border px-3 py-2 text-[13px] transition-colors"
                  style={{ borderColor: LINE, color: TEXT }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = ACCENT)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = LINE)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <HudFloorNav />
    </HudPageShell>
  );
}
