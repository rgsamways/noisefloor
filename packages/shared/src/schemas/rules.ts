import { z } from "zod";

// A small starter site-wide permission catalog — deliberately minimal.
// Department-specific (group-scoped) permissions are forward-looking per
// Robin ("I'd rather think on that more as the rest of the site develops")
// and get added once the features needing them exist. Adapted from kerfy's
// packages/shared/src/schemas/rules.ts (ALL_RULE_KEYS/ruleKeySchema):
// plain strings, not a DB enum, so the catalog grows without a migration.
// See openspec/changes/add-entity-group-permissions design.md's Decision 4.
export const SITE_RULE_KEYS = ["manage_users", "manage_groups", "manage_entities", "manage_kb_content"] as const;

export const siteRuleKeySchema = z.enum(SITE_RULE_KEYS);
export type SiteRuleKey = (typeof SITE_RULE_KEYS)[number];

/**
 * The group-scoped rule catalog "department-specific permissions... once
 * the features needing them exist" (see comment above) was waiting on —
 * organized around how a fixed-wireless ISP (NRN) actually operates, not
 * kerfy's construction-company domains. `manage_kb_content` deliberately
 * stays in SITE_RULE_KEYS above, not duplicated here: KB content is
 * global, not per-group. See openspec/changes/add-role-rules-catalog
 * design.md.
 */
export const GROUP_RULE_DOMAINS = [
  {
    name: "Tier 1 support",
    rules: [
      { key: "view_customer_account", label: "View customer account", description: "See a customer's account details and service history." },
      { key: "create_ticket", label: "Create a ticket", description: "Open a new support ticket for a customer." },
      { key: "view_own_tickets", label: "View own tickets", description: "See tickets assigned to you." },
      { key: "view_all_tickets", label: "View all tickets", description: "See every ticket across the team, not just your own." },
      { key: "edit_own_ticket", label: "Edit own ticket", description: "Update the details of a ticket assigned to you." },
      {
        key: "edit_any_ticket",
        label: "Edit any ticket",
        description: "Update the details of any ticket, including ones assigned to someone else.",
      },
      { key: "close_ticket", label: "Close a ticket", description: "Mark a ticket resolved and closed." },
      { key: "escalate_ticket", label: "Escalate a ticket", description: "Hand a ticket off to a higher support tier." },
      { key: "view_device_status", label: "View customer device status", description: "Check whether a customer's device is online." },
      { key: "reboot_customer_device", label: "Reboot a customer's device", description: "Remotely power-cycle a customer's device." },
      { key: "reset_customer_wifi", label: "Reset a customer's Wi-Fi", description: "Remotely reset a customer's Wi-Fi settings." },
    ],
  },
  {
    name: "Tier 2/3 support",
    rules: [
      { key: "view_radio_console", label: "View the radio console", description: "Open the radio diagnostic console for a device." },
      { key: "run_diagnostics", label: "Run diagnostics", description: "Run deeper diagnostic checks against a device." },
      {
        key: "modify_device_config",
        label: "Modify device configuration",
        description: "Change a device's configuration parameters directly.",
      },
    ],
  },
  {
    // Network-wide infrastructure, not tied to one customer's ticket —
    // a genuinely separate function from Tier 2/3's per-customer
    // escalation ladder, with its own (typically broader) access level.
    name: "NOC / network operations",
    rules: [
      {
        key: "view_network_topology",
        label: "View network topology",
        description: "See how the network's links and towers connect.",
      },
      {
        key: "manage_backhaul_links",
        label: "Manage backhaul links",
        description: "Configure or adjust backhaul links between towers.",
      },
      {
        key: "acknowledge_network_alerts",
        label: "Acknowledge network alerts",
        description: "Acknowledge an active network alert.",
      },
      { key: "view_tower_status", label: "View tower status", description: "Check a tower's operational status." },
    ],
  },
  {
    name: "Field installation",
    rules: [
      { key: "view_assigned_install_jobs", label: "View assigned install jobs", description: "See installs assigned to you." },
      { key: "submit_install_completion", label: "Submit install completion", description: "Mark an install job complete." },
      { key: "upload_site_survey_photos", label: "Upload site survey photos", description: "Attach site survey photos to a job." },
      {
        key: "record_signal_readings",
        label: "Record signal readings",
        description: "Log signal strength readings from a site visit.",
      },
      { key: "request_install_equipment", label: "Request install equipment", description: "Request equipment needed for an install." },
    ],
  },
  {
    name: "Provisioning & CPE management",
    rules: [
      { key: "provision_new_device", label: "Provision a new device", description: "Add a new device into the management system." },
      { key: "tag_device_to_customer", label: "Tag a device to a customer", description: "Link a device to a customer's account." },
      {
        key: "view_device_inventory_status",
        label: "View device inventory status",
        description: "See a device's current inventory/provisioning state.",
      },
      {
        key: "manage_genieacs_presets",
        label: "Manage GenieACS presets",
        description: "Configure GenieACS auto-provisioning presets.",
      },
      { key: "decommission_device", label: "Decommission a device", description: "Retire a device from active management." },
    ],
  },
  {
    name: "Dispatch & scheduling",
    rules: [
      { key: "view_dispatch_schedule", label: "View dispatch schedule", description: "See the day's dispatch schedule." },
      { key: "edit_dispatch_schedule", label: "Edit dispatch schedule", description: "Change the dispatch schedule." },
      { key: "assign_technician_to_job", label: "Assign a technician to a job", description: "Assign a technician to a job." },
      { key: "view_own_schedule", label: "View own schedule", description: "See your own schedule." },
      { key: "clock_in_out", label: "Clock in / out", description: "Clock in or out for a shift." },
    ],
  },
  {
    name: "Sales & account management",
    rules: [
      { key: "create_customer_account", label: "Create a customer account", description: "Create a new customer account." },
      {
        key: "run_site_feasibility_check",
        label: "Run a site feasibility check",
        description: "Check whether a site can get fixed-wireless service.",
      },
      { key: "create_service_quote", label: "Create a service quote", description: "Put together a service quote for a customer." },
      {
        key: "convert_quote_to_install_order",
        label: "Convert a quote to an install order",
        description: "Turn an accepted quote into an install order.",
      },
      {
        key: "manage_service_plans",
        label: "Manage service plans",
        description: "Create or edit the service plans customers can sign up for.",
      },
    ],
  },
  {
    name: "Billing & accounts",
    rules: [
      { key: "view_customer_billing", label: "View customer billing", description: "See a customer's billing details." },
      { key: "manage_customer_billing", label: "Manage customer billing", description: "Change a customer's billing details." },
      { key: "process_payment", label: "Process a payment", description: "Process a customer payment." },
      { key: "issue_credit_or_refund", label: "Issue a credit or refund", description: "Issue a credit or refund to a customer." },
      {
        key: "manage_billing_plans_catalog",
        label: "Manage billing plans catalog",
        description: "Manage the catalog of billing plans.",
      },
    ],
  },
  {
    name: "Inventory, warehouse & RMA",
    rules: [
      { key: "view_inventory_levels", label: "View inventory levels", description: "See current stock levels." },
      { key: "adjust_inventory_counts", label: "Adjust inventory counts", description: "Adjust recorded stock counts." },
      {
        key: "receive_equipment_shipment",
        label: "Receive an equipment shipment",
        description: "Log an incoming equipment shipment.",
      },
      { key: "process_device_rma", label: "Process a device RMA", description: "Process a returned device (RMA)." },
      {
        key: "refurbish_returned_device",
        label: "Refurbish a returned device",
        description: "Mark a returned device as refurbished and ready to redeploy.",
      },
    ],
  },
  {
    name: "Reporting & EOD",
    rules: [
      { key: "submit_eod_report", label: "Submit an EOD report", description: "Submit your end-of-day report." },
      { key: "view_own_eod_reports", label: "View own EOD reports", description: "See your own past EOD reports." },
      { key: "view_all_eod_reports", label: "View all EOD reports", description: "See everyone's EOD reports." },
      {
        key: "manage_eod_report_settings",
        label: "Manage EOD report settings",
        description: "Change the site's EOD report settings.",
      },
    ],
  },
  {
    name: "Training & knowledge base",
    rules: [
      { key: "view_kb_articles", label: "View KB articles", description: "Read knowledge base articles." },
      { key: "use_training_console", label: "Use the training console", description: "Use the training radio console." },
      { key: "view_own_training_progress", label: "View own training progress", description: "See your own training progress." },
      { key: "view_all_training_progress", label: "View all training progress", description: "See everyone's training progress." },
      {
        key: "access_case_scenarios",
        label: "Access case scenarios",
        description: "Open and play case-based training scenarios.",
      },
    ],
  },
  {
    name: "Compliance & safety",
    rules: [
      { key: "manage_spectrum_licensing", label: "Manage spectrum licensing", description: "Manage spectrum license records." },
      {
        key: "manage_tower_site_agreements",
        label: "Manage tower site agreements",
        description: "Manage tower site lease/agreement records.",
      },
      { key: "view_compliance_documents", label: "View compliance documents", description: "View compliance documents." },
      { key: "upload_compliance_documents", label: "Upload compliance documents", description: "Upload a compliance document." },
      {
        key: "manage_safety_incident_reports",
        label: "Manage safety incident reports",
        description: "Manage safety incident reports.",
      },
    ],
  },
] as const;

export const ALL_GROUP_RULE_KEYS = GROUP_RULE_DOMAINS.flatMap((d) => d.rules.map((r) => r.key));
export const groupRuleKeySchema = z.enum(ALL_GROUP_RULE_KEYS as [string, ...string[]]);
export type GroupRuleKey = (typeof ALL_GROUP_RULE_KEYS)[number];

/**
 * A role is a bulk-apply convenience only — applying one sets a
 * membership's `rules` to exactly this set; nothing at request time ever
 * checks "what role is this," only the resulting `rules[]` (mirrors
 * kerfy's ROLE_DEFAULT_RULES doc comment exactly). `site_admin`'s set is
 * every group rule key even though the real `siteAdmin` boolean already
 * bypasses group checks entirely — this template is only for the rare
 * case of giving someone an explicit membership showing equivalent access
 * without making them a global site admin.
 */
export const GROUP_ROLE_KEYS = [
  "site_admin",
  "owner",
  "tier1_support",
  "tier2_support",
  "tier3_support",
  "noc_tech",
  "noc_manager",
  "field_installer",
  "dispatcher",
  "sales_rep",
  "billing_admin",
  "warehouse_tech",
  "compliance_officer",
  "trainer",
] as const;
export type GroupRoleKey = (typeof GROUP_ROLE_KEYS)[number];

export const GROUP_ROLE_DEFAULT_RULES: Record<GroupRoleKey, readonly GroupRuleKey[]> = {
  site_admin: ALL_GROUP_RULE_KEYS,
  owner: [
    "view_all_tickets",
    "view_network_topology",
    "view_all_eod_reports",
    "view_compliance_documents",
    "view_customer_billing",
    "manage_service_plans",
  ],
  tier1_support: [
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
  ],
  // Tier 2/3 is the per-customer escalation ladder: each tier adds deeper
  // device-level diagnostic power over the last, same rule domains as
  // tier1_support throughout. NOC (below) is a genuinely separate
  // function — network-wide infrastructure, not one customer's ticket —
  // confirmed 2026-09-28 (Robin: NOC normally has even greater powers,
  // and splitting it out "matches our entity better").
  tier2_support: [
    "view_customer_account",
    "create_ticket",
    "view_own_tickets",
    "view_all_tickets",
    "edit_own_ticket",
    "edit_any_ticket",
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
    "view_radio_console",
    "run_diagnostics",
  ],
  tier3_support: [
    "view_customer_account",
    "create_ticket",
    "view_own_tickets",
    "view_all_tickets",
    "edit_own_ticket",
    "edit_any_ticket",
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
    "view_radio_console",
    "run_diagnostics",
    "modify_device_config",
  ],
  // Network-wide operations, not the customer-ticket escalation ladder —
  // correlates alerts/topology against tickets (view_all_tickets) without
  // owning ticket handling itself (no create/edit/close/escalate).
  noc_tech: [
    "view_all_tickets",
    "view_radio_console",
    "run_diagnostics",
    "view_network_topology",
    "acknowledge_network_alerts",
    "view_tower_status",
    "submit_eod_report",
    "view_own_eod_reports",
    "view_own_schedule",
    "clock_in_out",
  ],
  // The "even greater powers" tier above noc_tech — the manage_* actions
  // over shared network infrastructure, not just visibility/acknowledgment.
  noc_manager: [
    "view_all_tickets",
    "view_radio_console",
    "run_diagnostics",
    "view_network_topology",
    "acknowledge_network_alerts",
    "view_tower_status",
    "submit_eod_report",
    "view_own_eod_reports",
    "view_all_eod_reports",
    "view_own_schedule",
    "clock_in_out",
    "manage_backhaul_links",
    "manage_genieacs_presets",
    "decommission_device",
  ],
  field_installer: [
    "view_assigned_install_jobs",
    "submit_install_completion",
    "upload_site_survey_photos",
    "record_signal_readings",
    "request_install_equipment",
    "provision_new_device",
    "tag_device_to_customer",
    "view_own_schedule",
    "clock_in_out",
  ],
  dispatcher: [
    "view_dispatch_schedule",
    "edit_dispatch_schedule",
    "assign_technician_to_job",
    "view_all_tickets",
    "view_assigned_install_jobs",
  ],
  sales_rep: [
    "create_customer_account",
    "run_site_feasibility_check",
    "create_service_quote",
    "convert_quote_to_install_order",
    "view_own_schedule",
  ],
  billing_admin: [
    "view_customer_billing",
    "manage_customer_billing",
    "process_payment",
    "issue_credit_or_refund",
    "manage_billing_plans_catalog",
    "view_all_eod_reports",
  ],
  warehouse_tech: [
    "view_inventory_levels",
    "adjust_inventory_counts",
    "receive_equipment_shipment",
    "process_device_rma",
    "refurbish_returned_device",
    "view_own_schedule",
    "clock_in_out",
  ],
  compliance_officer: [
    "manage_spectrum_licensing",
    "manage_tower_site_agreements",
    "view_compliance_documents",
    "upload_compliance_documents",
    "manage_safety_incident_reports",
  ],
  // manage_kb_content is a SITE_RULE_KEYS entry, not a group rule — a
  // trainer who also needs it gets it granted via siteRules separately.
  trainer: ["view_kb_articles", "use_training_console", "view_own_training_progress", "view_all_training_progress"],
};

/** Every role's default set, unioned — mirrors kerfy's defaultRulesForRoles. */
export function defaultRulesForGroupRoles(roles: readonly GroupRoleKey[]): GroupRuleKey[] {
  const set = new Set<GroupRuleKey>();
  for (const role of roles) {
    for (const rule of GROUP_ROLE_DEFAULT_RULES[role]) set.add(rule);
  }
  return [...set];
}
