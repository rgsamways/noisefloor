import { describe, expect, it } from "vitest";
import { KbArticleSchema } from "./schema.js";

describe("KbArticleSchema", () => {
  it("accepts a well-formed article", () => {
    const result = KbArticleSchema.safeParse({
      id: "airtime",
      slug: "airtime",
      title: "Airtime",
      summary: "The share of available radio time actually spent transmitting or receiving.",
      body: "Full explanation goes here.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an article with relatedFields", () => {
    const result = KbArticleSchema.safeParse({
      id: "airtime",
      slug: "airtime",
      title: "Airtime",
      summary: "Summary.",
      body: "Body.",
      relatedFields: ["linkQualityPct", "channelUtilizationPct"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an article missing a required field", () => {
    const result = KbArticleSchema.safeParse({
      id: "airtime",
      slug: "airtime",
      title: "Airtime",
      // summary and body omitted
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-URL-safe slug", () => {
    const result = KbArticleSchema.safeParse({
      id: "airtime",
      slug: "Air Time!",
      title: "Airtime",
      summary: "Summary.",
      body: "Body.",
    });
    expect(result.success).toBe(false);
  });
});
