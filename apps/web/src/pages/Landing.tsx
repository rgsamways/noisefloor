import { Activity, ArrowRight, LayoutDashboard, Rows3 } from "lucide-react";
import { Link } from "react-router";
import { LinkPanel } from "@noisefloor/dashboards";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";
import { useDemoLinkTelemetry } from "../lib/demo-link-telemetry";

const MUTED = "#5a726e";
const ACCENT = "#3dffc4";
const ACCENT2 = "#7c9bff";

const FEATURES = [
  {
    title: "One console",
    Icon: LayoutDashboard,
    body: "Twenty-one fields, normalized across every vendor. Signal, noise, modulation, airtime — the instrument, not the interface underneath it.",
  },
  {
    title: "Two panels",
    Icon: Rows3,
    body: "The radio link on top, the service layer underneath. A bad reading isn't always the radio — DHCP, NAT, and addressing get their own instrument.",
  },
  {
    title: "Always live",
    Icon: Activity,
    body: "Readings drift and degrade like a real radio screen, not a static snapshot. Build a gut sense of normal, then watch it slip.",
  },
] as const;

// Matches homepage/homepage-laptop.html + -phone.html — the approved HUD
// homepage mockup, made real. Replaces the old case-study-era homepage
// (light theme, LinkCapacityChart fed by parked gallery data, Play/Build/
// Prove pillars) — see openspec/changes/homepage-conversion.
export function Landing() {
  const { local, remote } = useDemoLinkTelemetry();

  return (
    <HudPageShell>
      <div className="relative mx-auto max-w-[1296px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[15px] font-medium">
            <Activity size={18} aria-hidden="true" style={{ color: ACCENT }} />
            <span>noisefloor</span>
          </div>
          <Link to="/sign-in" className="text-[13px]" style={{ color: MUTED }}>
            Sign in
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 items-start gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h1 className="text-[40px] leading-[1.08] font-semibold tracking-tight md:text-[58px]">
              Learn to read the{" "}
              <span
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                instruments.
              </span>
            </h1>
            <p className="mt-5 max-w-[480px] text-[16px] leading-relaxed md:text-[17px]" style={{ color: "#9fb3af" }}>
              One vendor-neutral console for every fixed-wireless radio. Live telemetry normalized into a single
              schema — the skill is reading a link, not memorizing AirOS, WinBox, or cnMaestro.
            </p>
            <div className="mt-8 flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-5">
              <Link
                to="/console"
                className="inline-flex items-center gap-2.5 border px-[22px] py-[15px] text-[13px] font-semibold tracking-[0.06em] uppercase"
                style={{ borderColor: ACCENT, color: ACCENT, background: "rgba(61,255,196,0.08)" }}
              >
                <span>Open the console</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <span className="text-[11px] tracking-[0.06em]" style={{ color: MUTED }}>
                NO ACCOUNT · SIMULATED LINK
              </span>
            </div>
          </div>

          <LinkPanel local={local} remote={remote} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
          {FEATURES.map(({ title, Icon, body }) => (
            <div key={title} className="flex flex-col gap-2 border-t pt-4" style={{ borderColor: "#1c2a2e" }}>
              <div className="flex items-center gap-2.5">
                <Icon size={18} aria-hidden="true" style={{ color: ACCENT }} />
                <span className="text-xs font-semibold tracking-[0.1em] uppercase">{title}</span>
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: "#9fb3af" }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <HudFloorNav />
    </HudPageShell>
  );
}
