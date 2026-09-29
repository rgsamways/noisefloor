import { GROUP_ROLE_DEFAULT_RULES, GROUP_ROLE_KEYS, type GroupRoleKey } from "@noisefloor/shared";

export const ROLE_LABELS: Record<GroupRoleKey, string> = {
  site_admin: "Site admin",
  owner: "Owner",
  tier1_support: "Tier 1 support",
  tier2_support: "Tier 2 support",
  tier3_support: "Tier 3 support",
  noc_tech: "NOC tech",
  noc_manager: "NOC manager",
  field_installer: "Field installer",
  dispatcher: "Dispatcher",
  sales_rep: "Sales rep",
  billing_admin: "Billing admin",
  warehouse_tech: "Warehouse tech",
  compliance_officer: "Compliance officer",
  trainer: "Trainer",
};

// Roles are one-time presets, never stored on a membership — so the only
// honest label for a membership is one derived from an exact rule-set
// match (compared as sets, order-independent). Display only; nothing here
// affects access. With identical presets the first in catalog order wins.
export function roleForRules(rules: readonly string[]): GroupRoleKey | null {
  const actual = new Set(rules);
  for (const role of GROUP_ROLE_KEYS) {
    const preset = GROUP_ROLE_DEFAULT_RULES[role];
    if (preset.length === actual.size && preset.every((rule) => actual.has(rule))) return role;
  }
  return null;
}
