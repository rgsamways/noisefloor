import { describe, expect, it } from "vitest";
import { parseArticleMarkdown, splitExplanations, validateArticleSet } from "./parse.js";

const SAMPLE = `---
id: airtime
slug: airtime
title: Airtime
summary: The share of available radio time actually spent transmitting or receiving.
category: modulation-phy-capacity
relatedFields:
  - link.linkQualityPct
  - throughput.channelUtilizationPct
---

## Technical

Full technical explanation of airtime goes here, across multiple paragraphs.

A second paragraph.

## Layman

Plain-language explanation of airtime goes here.
`;

describe("parseArticleMarkdown", () => {
  it("round-trips a well-formed sample file", () => {
    const article = parseArticleMarkdown(SAMPLE);
    expect(article.id).toBe("airtime");
    expect(article.slug).toBe("airtime");
    expect(article.title).toBe("Airtime");
    expect(article.category).toBe("modulation-phy-capacity");
    expect(article.relatedFields).toEqual(["link.linkQualityPct", "throughput.channelUtilizationPct"]);
    expect(article.technicalExplanation).toContain("Full technical explanation of airtime");
    expect(article.technicalExplanation).toContain("A second paragraph.");
    expect(article.laymanExplanation).toContain("Plain-language explanation of airtime");
  });

  it("throws when a required frontmatter field is missing", () => {
    const missingSummary = `---\nid: x\nslug: x\ntitle: X\ncategory: rf-fundamentals\n---\n\n## Technical\n\nT.\n\n## Layman\n\nL.\n`;
    expect(() => parseArticleMarkdown(missingSummary)).toThrow();
  });

  it("throws when the body is missing a Technical or Layman section", () => {
    const missingLayman = SAMPLE.replace(/## Layman[\s\S]*/, "");
    expect(() => parseArticleMarkdown(missingLayman)).toThrow(/Technical.*Layman/);
  });
});

describe("splitExplanations", () => {
  it("splits regardless of section order", () => {
    const result = splitExplanations("## Layman\n\nPlain.\n\n## Technical\n\nDeep.\n");
    expect(result.laymanExplanation).toBe("Plain.");
    expect(result.technicalExplanation).toBe("Deep.");
  });
});

describe("validateArticleSet", () => {
  it("passes for a set with no duplicate slugs", () => {
    const a = parseArticleMarkdown(SAMPLE);
    const b = parseArticleMarkdown(SAMPLE.replace(/airtime/g, "signal-strength"));
    expect(() => validateArticleSet([a, b])).not.toThrow();
  });

  it("throws when two articles share a slug", () => {
    const a = parseArticleMarkdown(SAMPLE);
    const b = parseArticleMarkdown(SAMPLE);
    expect(() => validateArticleSet([a, b])).toThrow(/Duplicate KB article slug/);
  });
});
