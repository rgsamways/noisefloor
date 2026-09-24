import { useMemo, useState } from "react";
import { Link } from "react-router";
import Fuse from "fuse.js";
import { articles } from "@noisefloor/kb";
import { KB_CATEGORY_LABELS, KB_CATEGORY_OPTIONS } from "../lib/kb-category-labels";
import { ContentFooterLinks } from "../components/ContentFooterLinks";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";

const LINE = "#1c2a2e";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";
const TEXT = "#d7e6e2";

// Matches docs/mockups/noisefloor-mock-kb-index.html, extended per
// openspec/changes/kb-content-model-and-search: a search box and
// category filter now sit above the card grid — the original
// knowledge-base change's Non-Goal deferring this until there's enough
// real content is deliberately being crossed here (design.md Decision 1).
export function KbIndex() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const fuse = useMemo(() => new Fuse(articles, { keys: ["title", "summary", "aliases"], threshold: 0.3 }), []);

  const filtered = useMemo(() => {
    const base = query.trim() ? fuse.search(query.trim()).map((result) => result.item) : articles;
    return category ? base.filter((article) => article.category === category) : base;
  }, [fuse, query, category]);

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

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search terms…"
          className="mt-6 w-full max-w-[420px] border bg-transparent px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: LINE, color: TEXT }}
        />

        <div className="mt-3.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className="border px-2.5 py-1 text-[11px] tracking-[0.03em]"
            style={{
              borderColor: category === null ? ACCENT : LINE,
              color: category === null ? ACCENT : MUTED,
            }}
          >
            All
          </button>
          {KB_CATEGORY_OPTIONS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory((current) => (current === key ? null : key))}
              className="border px-2.5 py-1 text-[11px] tracking-[0.03em]"
              style={{
                borderColor: category === key ? ACCENT : LINE,
                color: category === key ? ACCENT : MUTED,
              }}
            >
              {KB_CATEGORY_LABELS[key]}
            </button>
          ))}
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((article) => (
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
          {filtered.length === 0 && (
            <p className="text-xs" style={{ color: MUTED }}>
              No articles match.
            </p>
          )}
        </div>

        <ContentFooterLinks />
      </div>

      <HudFloorNav />
    </HudPageShell>
  );
}
