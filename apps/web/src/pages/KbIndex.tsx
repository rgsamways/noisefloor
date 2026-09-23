import { Link } from "react-router";
import { articles } from "@noisefloor/kb";
import { ContentFooterLinks } from "../components/ContentFooterLinks";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";

const LINE = "#1c2a2e";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";

// Matches docs/mockups/noisefloor-mock-kb-index.html — a flat card index,
// not grouped by category: KbArticle has no category field, and
// openspec/changes/knowledge-base's Non-Goals are explicit that
// search/filtering/categorization UI is out of scope until there's real
// content to need it. No severity colors — KB content is definitional,
// not a judged reading.
export function KbIndex() {
  return (
    <HudPageShell>
      <div className="relative mx-auto max-w-[960px]">
        <div className="text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
          Reference
        </div>
        <h1 className="mt-3 text-[32px] font-semibold tracking-tight">Knowledge base</h1>
        <p className="mt-3.5 max-w-[560px] text-[14px] leading-relaxed" style={{ color: "#9fb3af" }}>
          Definitions for the terms behind the console's readings. Claude-drafted, reviewed for accuracy — not
          vendor-specific, not tied to any case.
        </p>

        <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.slug}
              to={`/kb/${article.slug}`}
              className="flex flex-col gap-2 border p-4 transition-colors"
              style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = LINE)}
            >
              <span className="text-sm font-semibold">{article.title}</span>
              <p className="m-0 text-xs leading-relaxed" style={{ color: "#9fb3af" }}>
                {article.summary}
              </p>
            </Link>
          ))}
        </div>

        <ContentFooterLinks />
      </div>

      <HudFloorNav />
    </HudPageShell>
  );
}
