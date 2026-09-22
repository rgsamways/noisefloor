import { describe, expect, it } from "vitest";
import { linkProfileBaseline } from "./baseline.js";

describe("linkProfileBaseline", () => {
  it("gives a short urban link a stronger baseline than a long rural link", () => {
    const short = linkProfileBaseline({ distanceKm: 0.2, band: "5.8GHz", gearClass: "sector" });
    const long = linkProfileBaseline({ distanceKm: 15, band: "5.8GHz", gearClass: "sector" });

    expect(short.signalDbm).toBeGreaterThan(long.signalDbm);
    expect(short.linkHealth).toBeGreaterThan(long.linkHealth);
  });

  it("keeps linkHealth within the valid 0-1 range regardless of distance", () => {
    const veryLong = linkProfileBaseline({ distanceKm: 40, band: "5.8GHz", gearClass: "cpe" });
    expect(veryLong.linkHealth).toBeGreaterThanOrEqual(0);
    expect(veryLong.linkHealth).toBeLessThanOrEqual(1);
  });
});
