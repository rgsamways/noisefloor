import { describe, expect, it } from "vitest";
import {
  ALL_GROUP_RULE_KEYS,
  defaultRulesForGroupRoles,
  GROUP_ROLE_DEFAULT_RULES,
  GROUP_ROLE_KEYS,
  groupRuleKeySchema,
  SITE_RULE_KEYS,
  siteRuleKeySchema,
} from "./rules.js";

describe("siteRuleKeySchema", () => {
  it("accepts a known rule key", () => {
    expect(siteRuleKeySchema.safeParse("manage_users").success).toBe(true);
  });

  it("rejects an unknown rule key", () => {
    expect(siteRuleKeySchema.safeParse("not_a_real_rule").success).toBe(false);
  });
});

describe("groupRuleKeySchema", () => {
  it("accepts a known group rule key", () => {
    expect(groupRuleKeySchema.safeParse("reboot_customer_device").success).toBe(true);
  });

  it("rejects an unknown rule key", () => {
    expect(groupRuleKeySchema.safeParse("not_a_real_rule").success).toBe(false);
  });
});

describe("ALL_GROUP_RULE_KEYS", () => {
  it("has no duplicate keys across domains", () => {
    expect(new Set(ALL_GROUP_RULE_KEYS).size).toBe(ALL_GROUP_RULE_KEYS.length);
  });

  it("has no overlap with SITE_RULE_KEYS", () => {
    const overlap = ALL_GROUP_RULE_KEYS.filter((k) => (SITE_RULE_KEYS as readonly string[]).includes(k));
    expect(overlap).toEqual([]);
  });
});

describe("GROUP_ROLE_DEFAULT_RULES", () => {
  it("every role's default set only contains real catalog keys", () => {
    for (const role of GROUP_ROLE_KEYS) {
      for (const rule of GROUP_ROLE_DEFAULT_RULES[role]) {
        expect(ALL_GROUP_RULE_KEYS).toContain(rule);
      }
    }
  });

  it("tier1_support's default set matches its designed keys", () => {
    expect(GROUP_ROLE_DEFAULT_RULES.tier1_support).toEqual([
      "view_customer_account",
      "create_ticket",
      "view_own_tickets",
      "view_all_tickets",
      "edit_own_ticket",
      "close_ticket",
      "escalate_ticket",
      "view_device_status",
      "reboot_customer_device",
      "reset_customer_wifi",
      "submit_eod_report",
      "view_own_eod_reports",
      "view_kb_articles",
      "use_training_console",
      "view_own_schedule",
      "clock_in_out",
    ]);
  });

  it("site_admin's default set is every group rule key", () => {
    expect(GROUP_ROLE_DEFAULT_RULES.site_admin).toEqual(ALL_GROUP_RULE_KEYS);
  });
});

describe("defaultRulesForGroupRoles", () => {
  it("unions multiple roles' default sets without duplicates", () => {
    const result = defaultRulesForGroupRoles(["tier1_support", "dispatcher"]);
    expect(new Set(result).size).toBe(result.length);
    expect(result).toContain("reboot_customer_device");
    expect(result).toContain("edit_dispatch_schedule");
  });
});
