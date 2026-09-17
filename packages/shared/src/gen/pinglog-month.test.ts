import { describe, expect, it } from "vitest";
import { pinglogMonth } from "./pinglog-month.js";

describe("pinglogMonth", () => {
  it("stamps a configured outage as loss across its window", () => {
    const grid = pinglogMonth(
      { baseLossPct: 0, outages: [{ start: "2026-08-14T02:00", minutes: 20 }], bucketMinutes: 10 },
      "seed-a",
    );
    const dayRow = grid.grid[13]!; // 14th day, 0-indexed
    // 02:00 = minute 120 -> bucket 12; 20 minutes / 10-minute buckets = 2 buckets
    expect(dayRow[12]).toBe("loss");
    expect(dayRow[13]).toBe("loss");
  });

  it("produces mostly-ok cells at zero base loss outside outages", () => {
    const grid = pinglogMonth({ baseLossPct: 0 }, "seed-b");
    const allOk = grid.grid.every((row) => row.every((cell) => cell === "ok"));
    expect(allOk).toBe(true);
  });

  it("is deterministic for the same seed", () => {
    const params = { baseLossPct: 5, eveningSpeckle: 3 };
    const a = pinglogMonth(params, "same-seed");
    const b = pinglogMonth(params, "same-seed");
    expect(a).toEqual(b);
  });
});
