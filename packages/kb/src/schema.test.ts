import { describe, expect, it } from "vitest";
import { KbArticleSchema } from "./schema.js";

function baseArticle(overrides: Record<string, unknown> = {}) {
  return {
    id: "airtime",
    slug: "airtime",
    title: "Airtime",
    summary: "The share of available radio time actually spent transmitting or receiving.",
    technicalExplanation: "Full technical explanation goes here.",
    laymanExplanation: "Plain-language explanation goes here.",
    category: "modulation-phy-capacity",
    ...overrides,
  };
}

function omit(article: Record<string, unknown>, field: string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(article).filter(([key]) => key !== field));
}

describe("KbArticleSchema", () => {
  it("accepts a well-formed article", () => {
    const result = KbArticleSchema.safeParse(baseArticle());
    expect(result.success).toBe(true);
  });

  it("accepts an article with icon, aliases, and relatedFields", () => {
    const result = KbArticleSchema.safeParse(
      baseArticle({
        icon: "radio-tower",
        aliases: ["airtime utilization"],
        relatedFields: ["link.linkQualityPct", "throughput.channelUtilizationPct"],
      }),
    );
    expect(result.success).toBe(true);
  });

  it.each(["summary", "technicalExplanation", "laymanExplanation", "category"])(
    "rejects an article missing %s",
    (field) => {
      const result = KbArticleSchema.safeParse(omit(baseArticle(), field));
      expect(result.success).toBe(false);
    },
  );

  it("rejects an unrecognized category value", () => {
    const result = KbArticleSchema.safeParse(baseArticle({ category: "not-a-real-category" }));
    expect(result.success).toBe(false);
  });

  it("rejects a non-URL-safe slug", () => {
    const result = KbArticleSchema.safeParse(baseArticle({ slug: "Air Time!" }));
    expect(result.success).toBe(false);
  });
});
