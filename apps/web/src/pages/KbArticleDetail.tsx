import { Link, useParams } from "react-router";
import Markdown from "react-markdown";
import { articles } from "@noisefloor/kb";
import { ContentFooterLinks } from "../components/ContentFooterLinks";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";

const LINE = "#1c2a2e";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";

// Matches docs/mockups/noisefloor-mock-kb-detail.html — article + a
// related-fields sidebar. No severity colors, no "unit" chip (KbArticle
// has no unit field — that was specific to the mockup's console-reading
// framing, not part of the actual schema).
export function KbArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const article = articles.find((a) => a.slug === slug);

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
            </div>
            <h1 className="mt-3.5 text-[28px] font-semibold tracking-tight">{article.title}</h1>
            <p
              className="mt-4 max-w-[560px] border-l-2 pl-4 text-[15px] leading-relaxed"
              style={{ borderColor: ACCENT, color: "#9fb3af" }}
            >
              {article.summary}
            </p>

            <article className="mt-8 max-w-[600px] text-[14px] leading-[1.75]" style={{ color: "#d7e6e2" }}>
              <Markdown>{article.body}</Markdown>
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
              {article.relatedFields.map((field) => (
                <div key={field} className="border-b py-2 text-xs last:border-b-0" style={{ borderColor: LINE }}>
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
