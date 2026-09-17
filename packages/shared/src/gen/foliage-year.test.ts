import { describe, expect, it } from "vitest";
import { foliageYear } from "./foliage-year.js";

describe("foliageYear", () => {
  it("transitions toward leafOnDbm starting at leafOnDate", () => {
    const series = foliageYear(
      { leafOnDbm: -72, leafOffDbm: -65, leafOnDate: "05-24", leafOffDate: "10-20" },
      "seed-a",
    );
    const before = series.find((p) => p.t === "05-19");
    const after = series.find((p) => p.t === "06-15");
    expect(before).toBeDefined();
    expect(after).toBeDefined();
    // before leaf-on, values sit near the leaf-off baseline; well after,
    // they've moved toward the (more negative) leaf-on value.
    expect(before!.v).toBeGreaterThan(-67);
    expect(after!.v).toBeLessThan(-70);
  });

  it("is deterministic for the same seed", () => {
    const params = { leafOnDbm: -72, leafOffDbm: -65, leafOnDate: "05-24", leafOffDate: "10-20" };
    const a = foliageYear(params, "same-seed");
    const b = foliageYear(params, "same-seed");
    expect(a).toEqual(b);
  });
});
