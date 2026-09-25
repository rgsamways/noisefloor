import { describe, expect, it } from "vitest";
import { siteRuleKeySchema } from "./rules.js";

describe("siteRuleKeySchema", () => {
  it("accepts a known rule key", () => {
    expect(siteRuleKeySchema.safeParse("manage_users").success).toBe(true);
  });

  it("rejects an unknown rule key", () => {
    expect(siteRuleKeySchema.safeParse("not_a_real_rule").success).toBe(false);
  });
});
