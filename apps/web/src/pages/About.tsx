import { ContentFooterLinks } from "../components/ContentFooterLinks";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";

const MUTED = "#5a726e";

// Matches the approved copy pass (2026-09-23) — deliberately no personal
// narrative (Robin asked for it to be cut): this is about the product's
// reasoning, not a bio. Not in HudFloorNav on purpose — reachable via
// ContentFooterLinks instead, same reasoning as that component's own header
// comment.
export function About() {
  return (
    <HudPageShell>
      <div className="relative mx-auto max-w-[960px]">
        <div className="text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
          About
        </div>
        <h1 className="mt-3 text-[32px] font-semibold tracking-tight">Why noisefloor exists.</h1>

        <div className="mt-6 max-w-[640px] space-y-5 text-[15px] leading-relaxed" style={{ color: "#9fb3af" }}>
          <p>
            Most fixed-wireless training material teaches you a vendor's dashboard — which menu holds the signal
            number in AirOS, where it lives in WinBox, what cnMaestro calls it. That's not the actual skill. The
            skill is reading a link: recognizing what real degradation looks like, telling a radio problem from a
            service-layer problem, knowing when a reading is genuinely alarming versus just normal noise.
          </p>
          <p>
            noisefloor teaches that directly. Every fault the console can simulate is modeled on a real,
            recognizable diagnostic pattern — a chain imbalance from misalignment, a lease that expired overnight, a
            customer's router quietly losing link while the radio itself stays green — normalized into one
            vendor-neutral schema instead of a dozen proprietary ones.
          </p>
          <p>There's no login, no case to complete, no score. Just a live instrument, and the chance to build a gut sense of normal.</p>
        </div>

        <ContentFooterLinks />
      </div>

      <HudFloorNav />
    </HudPageShell>
  );
}
