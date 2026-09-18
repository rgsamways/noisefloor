import { describe, expect, it } from "vitest";
import { AnnotationSchema } from "./annotation.js";

describe("AnnotationSchema", () => {
  it("accepts a well-formed annotation", () => {
    const result = AnnotationSchema.safeParse({
      target: { series: "signalTrace1y", t: "05-24" },
      label: "Leaf-out. −8 dB in four days.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an annotation missing a label", () => {
    const result = AnnotationSchema.safeParse({ target: { series: "signalTrace1y", t: "05-24" } });
    expect(result.success).toBe(false);
  });
});
