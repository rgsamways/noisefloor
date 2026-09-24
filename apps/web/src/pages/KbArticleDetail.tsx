import { useState } from "react";
import { Link, useParams } from "react-router";
import Markdown from "react-markdown";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { articles } from "@noisefloor/kb";
import { KB_CATEGORY_LABELS } from "../lib/kb-category-labels";
import { ContentFooterLinks } from "../components/ContentFooterLinks";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";

const LINE = "#1c2a2e";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";
const TEXT = "#d7e6e2";

type ExplanationLevel = "layman" | "technical";

// Matches docs/mockups/noisefloor-mock-kb-detail.html — article + a
// related-fields sidebar. Extended per openspec/changes/
// kb-content-model-and-search: a technical/layman toggle (defaulting to
// layman, design.md's Decision 5), the article's icon, and relatedFields
// rendered as real (if currently unlinked) chips confirming each path
// resolved, instead of plain non-linking text. No severity colors — KB
// content is definitional, not a judged reading.
export function KbArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const article = articles.find((a) => a.slug === slug);
  const [level, setLevel] = useState<ExplanationLevel>("layman");

  if (!article) {
    return (
      <HudPageShell>
        <div className="relative mx-auto max-w-[720px]">
          <p className="text-sm" style={{ color: MUTED }}>
            No article found at that address.
          </p>
          <Link to="/kb" className="mt-3 inline-block text-sm" style={{ color: ACCENT }}>
            ← Back to the knowledge base
          </Link>
          <ContentFooterLinks />
        </div>
        <HudFloorNav />
      </HudPageShell>
    );
  }

  const explanation = level === "layman" ? article.laymanExplanation : article.technicalExplanation;

  return (
    <HudPageShell>
      <div className="relative mx-auto max-w-[960px]">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_260px]">
          <div>
            <div className="flex items-center gap-2 text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
              <Link to="/kb" style={{ color: MUTED }}>
                Knowledge base
              </Link>
              <span>/</span>
              <span style={{ color: ACCENT }}>{KB_CATEGORY_LABELS[article.category]}</span>
            </div>
            <div className="mt-3.5 flex items-center gap-2.5">
              {/* article.icon is a plain string in KbArticle (validated at
                  packages/kb's build time against lucide-react's own
                  iconNames, see icon-validation.ts) — cast to IconName
                  here rather than threading that literal-union type
                  through the schema, which stays framework-agnostic. */}
              {article.icon && <DynamicIcon name={article.icon as IconName} size={26} color={ACCENT} aria-hidden="true" />}
              <h1 className="text-[28px] font-semibold tracking-tight">{article.title}</h1>
            </div>
            <p
              className="mt-4 max-w-[560px] border-l-2 pl-4 text-[15px] leading-relaxed"
              style={{ borderColor: ACCENT, color: "#9fb3af" }}
            >
              {article.summary}
            </p>

            <div className="mt-6 flex gap-1.5 text-[11px] tracking-[0.04em] uppercase">
              {(["layman", "technical"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLevel(option)}
                  className="border px-2.5 py-1"
                  style={{
                    borderColor: level === option ? ACCENT : LINE,
                    color: level === option ? ACCENT : MUTED,
                  }}
                >
                  {option === "layman" ? "Plain language" : "Technical"}
                </button>
              ))}
            </div>

            <article className="mt-6 max-w-[600px] text-[14px] leading-[1.75]" style={{ color: TEXT }}>
              <Markdown>{explanation}</Markdown>
            </article>
          </div>

          {article.relatedFields && article.relatedFields.length > 0 && (
            <aside className="h-fit border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
              <div
                className="mb-3 border-b border-dashed pb-2 text-[10px] tracking-[0.1em] uppercase"
                style={{ borderColor: LINE, color: ACCENT }}
              >
                Related fields
              </div>
              {/* No console deep-link affordance exists yet (design.md's
                  Non-Goals) — these confirm the path resolved to a real
                  console-schema field at build time, not a live link. */}
              {article.relatedFields.map((field) => (
                <div
                  key={field}
                  className="mb-1.5 inline-block border px-2 py-1 text-[11px] last:mb-0"
                  style={{ borderColor: LINE, color: "#9fb3af" }}
                >
                  {field}
                </div>
              ))}
            </aside>
          )}
        </div>

        <ContentFooterLinks />
      </div>

      <HudFloorNav />
    </HudPageShell>
  );
}
