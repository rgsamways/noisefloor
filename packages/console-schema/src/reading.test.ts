import { describe, expect, it } from "vitest";
import { z } from "zod";
import { readingSchema } from "./reading.js";

describe("readingSchema", () => {
  it("accepts a value with a well-formed ISO asOf timestamp", () => {
    const schema = readingSchema(z.number());
    const result = schema.safeParse({ value: -58, asOf: "2026-09-21T20:00:00Z" });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed asOf timestamp", () => {
    const schema = readingSchema(z.number());
    const result = schema.safeParse({ value: -58, asOf: "not-a-date" });
    expect(result.success).toBe(false);
  });

  it("validates the wrapped value against the given schema", () => {
    const schema = readingSchema(z.enum(["connected", "associating", "down"]));
    expect(schema.safeParse({ value: "connected", asOf: "2026-09-21T20:00:00Z" }).success).toBe(true);
    expect(schema.safeParse({ value: "reconnecting", asOf: "2026-09-21T20:00:00Z" }).success).toBe(false);
  });
});
