import { LinkCapacityChart } from "@noisefloor/dashboards";
import { Activity, ArrowRight, BookOpen, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router";
import { BottomNav } from "../components/BottomNav";
import { gallerySeed, galleryWorld } from "../lib/gallery-world";

const COLUMNS = [
  {
    title: "Play",
    Icon: BookOpen,
    body: "Work a ticket one stage at a time. Being wrong at stage one and right by stage three is the skill, and the score knows it.",
    bodyShort: "Work a ticket one stage at a time.",
  },
  {
    title: "Build",
    Icon: SlidersHorizontal,
    body: "Earn the builder. Turn the knobs on a synthetic link and watch what moves. The world only renders when its numbers agree.",
    bodyShort: "Turn the knobs. Watch what moves.",
  },
  {
    title: "Prove",
    Icon: ShieldCheck,
    body: "Cases get challenged, argued over, and revised. People don't get ranked. Cases do.",
    bodyShort: "Cases get ranked. People don't.",
  },
] as const;

export function Landing() {
  return (
    <div className="flex min-h-screen flex-col pb-[72px] md:pb-16">
      <header className="flex items-center justify-between px-5 pt-5 md:px-[72px] md:pt-7">
        <div className="flex items-center gap-2 font-mono text-sm font-medium md:gap-2.5 md:text-[15px]">
          <Activity size={16} className="md:hidden" aria-hidden="true" />
          <Activity size={18} className="hidden md:block" aria-hidden="true" />
          <span>noisefloor</span>
        </div>
        <Link to="/sign-in" className="py-3 font-mono text-[13px]">
          Sign in
        </Link>
      </header>

      <section className="grid grid-cols-1 gap-10 px-5 pt-11 md:grid-cols-2 md:gap-20 md:px-[72px] md:pt-[104px]">
        <div className="flex flex-col gap-4 md:gap-7">
          <h1 className="text-[40px] font-semibold leading-[1.06] tracking-[-0.02em] md:text-[64px] md:leading-[1.04]">
            Learn to read the instruments.
          </h1>
          <p className="max-w-[520px] text-base leading-relaxed text-body md:text-xl">
            Case-based training for fixed-wireless support techs. Real-shaped tickets, told in stages. Commit to a
            theory before you see the next piece of evidence.
          </p>
          <div className="flex flex-col gap-3 pt-1 md:flex-row md:items-center md:gap-6">
            <Link
              to="/cases"
              className="inline-flex items-center justify-between gap-3 bg-foreground px-5 py-4 text-base font-medium text-background md:justify-start"
            >
              <span>Play the demo stage</span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <span className="font-mono text-xs text-muted">No account · about 10 minutes</span>
          </div>
        </div>

        <div className="md:mt-3">
          <LinkCapacityChart world={galleryWorld} seed={gallerySeed} />
        </div>
      </section>

      {/* Play / Build / Prove — phone: compact rows */}
      <section className="px-5 pt-7 md:hidden">
        {COLUMNS.map((col) => (
          <div key={col.title} className="flex items-center gap-3 border-t border-foreground py-3.5 last:border-b">
            <col.Icon size={18} aria-hidden="true" />
            <span className="w-14 shrink-0 text-[15px] font-semibold">{col.title}</span>
            <span className="text-[13px] leading-snug text-body">{col.bodyShort}</span>
          </div>
        ))}
      </section>

      {/* Play / Build / Prove — laptop: three columns */}
      <section className="hidden gap-12 px-[72px] pt-24 md:grid md:grid-cols-3">
        {COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col gap-3 border-t border-foreground pt-5">
            <div className="flex items-center gap-2.5">
              <col.Icon size={20} aria-hidden="true" />
              <span className="text-lg font-semibold">{col.title}</span>
            </div>
            <p className="text-[15px] leading-relaxed text-body">{col.body}</p>
          </div>
        ))}
      </section>

      <BottomNav />
    </div>
  );
}
