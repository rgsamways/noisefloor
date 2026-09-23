import { ContentFooterLinks } from "../components/ContentFooterLinks";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";

const MUTED = "#5a726e";
const ACCENT = "#3dffc4";

const ITEMS = [
  {
    title: "Real vendor telemetry",
    body: "The console runs on simulated data today. The schema is built to also carry live readings from real radios — that's the next real upgrade, not a simulation forever.",
  },
  {
    title: "More faults, more failure modes",
    body: "The fault library keeps growing — new diagnostic patterns as they show up in real work, not a fixed set.",
  },
  {
    title: "A real knowledge base",
    body: "The reference section exists structurally, but the articles behind it are still being written.",
  },
  {
    title: "Practice scenarios",
    body: "Guided cases — a bad link, a wrong assumption, a customer on hold — are coming back as a layer on top of the console, not gone for good.",
  },
  {
    title: "Accounts that unlock something",
    body: "Sign-in exists today but doesn't do much yet. That's changing.",
  },
] as const;

// Approved copy pass (2026-09-23) — real, already-decided next steps only,
// not speculative promises. Deliberately excludes the multi-craft expansion
// idea: that's still an internal naming-level awareness note, not concrete
// enough to say out loud publicly yet. Not in HudFloorNav, same reasoning as
// About/Contact — reachable via ContentFooterLinks instead.
export function Roadmap() {
  return (
    <HudPageShell>
      <div className="relative mx-auto max-w-[960px]">
        <div className="text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
          Roadmap
        </div>
        <h1 className="mt-3 text-[32px] font-semibold tracking-tight">What's next.</h1>
        <p className="mt-3.5 max-w-[560px] text-[14px] leading-relaxed" style={{ color: "#9fb3af" }}>
          noisefloor is a work in progress, built in the open. Here's what's actually planned, not just hoped for.
        </p>

        <div className="mt-9 flex max-w-[640px] flex-col gap-6">
          {ITEMS.map(({ title, body }) => (
            <div key={title} className="flex flex-col gap-2 border-t pt-5" style={{ borderColor: "#1c2a2e" }}>
              <span className="text-sm font-semibold" style={{ color: ACCENT }}>
                {title}
              </span>
              <p className="text-[14px] leading-relaxed" style={{ color: "#9fb3af" }}>
                {body}
              </p>
            </div>
          ))}
        </div>

        <ContentFooterLinks />
      </div>

      <HudFloorNav />
    </HudPageShell>
  );
}
