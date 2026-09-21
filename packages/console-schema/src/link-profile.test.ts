import { describe, expect, it } from "vitest";
import { LinkProfileSchema } from "./link-profile.js";

describe("LinkProfileSchema", () => {
  it("validates as pure data, with no dependency on any telemetry value", () => {
    const result = LinkProfileSchema.safeParse({
      distanceKm: 3.1,
      band: "5.8GHz",
      gearClass: "PtMP-sector",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a profile missing a required field", () => {
    const result = LinkProfileSchema.safeParse({ distanceKm: 3.1, band: "5.8GHz" });
    expect(result.success).toBe(false);
  });
});
