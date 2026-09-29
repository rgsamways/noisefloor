import { GROUP_ROLE_DEFAULT_RULES } from "@noisefloor/shared";
import { describe, expect, it } from "vitest";
import { roleForRules } from "./role-labels";

describe("roleForRules", () => {
  it("matches a preset's exact rule set", () => {
    expect(roleForRules(GROUP_ROLE_DEFAULT_RULES.tier1_support)).toBe("tier1_support");
  });

  it("matches regardless of rule order", () => {
    expect(roleForRules([...GROUP_ROLE_DEFAULT_RULES.tier1_support].reverse())).toBe("tier1_support");
  });

  it("returns null when a rule is missing", () => {
    expect(roleForRules(GROUP_ROLE_DEFAULT_RULES.tier1_support.slice(1))).toBeNull();
  });

  it("returns null when an extra rule is present", () => {
    expect(roleForRules([...GROUP_ROLE_DEFAULT_RULES.tier1_support, "manage_billing_plans_catalog"])).toBeNull();
  });

  it("returns null for an empty rule set", () => {
    expect(roleForRules([])).toBeNull();
  });
});
