import { describe, expect, it } from "vitest";
import { parseArticleMarkdown, validateArticleSet } from "./parse.js";

const SAMPLE = `---
id: airtime
slug: airtime
title: Airtime
summary: The share of available radio time actually spent transmitting or receiving.
relatedFields:
  - linkQualityPct
  - channelUtilizationPct
---

Full explanation of airtime goes here, across multiple paragraphs.

A second paragraph.
`;

describe("parseArticleMarkdown", () => {
  it("round-trips a well-formed sample file", () => {
    const article = parseArticleMarkdown(SAMPLE);
    expect(article.id).toBe("airtime");
    expect(article.slug).toBe("airtime");
    expect(article.title).toBe("Airtime");
    expect(article.relatedFields).toEqual(["linkQualityPct", "channelUtilizationPct"]);
    expect(article.body).toContain("Full explanation of airtime");
    expect(article.body).toContain("A second paragraph.");
  });

  it("throws when a required frontmatter field is missing", () => {
    const missingSummary = `---\nid: x\nslug: x\ntitle: X\n---\nBody.\n`;
    expect(() => parseArticleMarkdown(missingSummary)).toThrow();
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
