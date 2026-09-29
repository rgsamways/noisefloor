import { GROUP_RULE_DOMAINS, GROUP_ROLE_DEFAULT_RULES, GROUP_ROLE_KEYS, type GroupRoleKey, type GroupRuleKey } from "@noisefloor/shared";
import {
  CalendarClock,
  ClipboardList,
  GraduationCap,
  Handshake,
  Headset,
  Info,
  Network,
  Package,
  Receipt,
  Router,
  ShieldCheck,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";
import { apiFetch } from "../lib/api";

const LINE = "#1c2a2e";
const TEXT = "#d7e6e2";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";

type Member = { id: string; userId: string; name: string; email: string; tier: string | null; rules: string[]; status: "active" | "revoked" };
type PendingInvitation = { id: string; email: string; tier: string | null; rules: string[] };
type MembersResponse = { members: Member[]; pendingInvitations: PendingInvitation[] };
type AdminUserOption = { id: string; name: string; email: string };

const DOMAIN_ICONS: Record<string, LucideIcon> = {
  "Tier 1 support": Headset,
  "Tier 2/3 support": Wrench,
  "NOC / network operations": Network,
  "Field installation": Truck,
  "Provisioning & CPE management": Router,
  "Dispatch & scheduling": CalendarClock,
  "Sales & account management": Handshake,
  "Billing & accounts": Receipt,
  "Inventory, warehouse & RMA": Package,
  "Reporting & EOD": ClipboardList,
  "Training & knowledge base": GraduationCap,
  "Compliance & safety": ShieldCheck,
};

const ROLE_LABELS: Record<GroupRoleKey, string> = {
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

// Applying a role replaces the rule set outright rather than merging —
// it's a one-time bulk-apply convenience, not a stored, ongoing
// classification (design.md's UI decision). Individual checkboxes stay
// freely hand-editable afterward with no link back to whichever role, if
// any, was last applied.
function RuleChecklist({ selected, onToggle }: { selected: readonly string[]; onToggle: (rule: GroupRuleKey, checked: boolean) => void }) {
  return (
    <div className="flex flex-col gap-5">
      {GROUP_RULE_DOMAINS.map((domain) => {
        const Icon = DOMAIN_ICONS[domain.name];
        return (
          <div key={domain.name}>
            <div className="mb-2 flex items-center gap-1.5 text-[10px] tracking-[0.08em] uppercase" style={{ color: MUTED }}>
              {Icon && <Icon size={12} style={{ color: ACCENT }} />}
              {domain.name}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2.5">
              {domain.rules.map((rule) => (
                // A native title tooltip carries the blurb — keeps the
                // checklist scannable at a glance without doubling its
                // length with always-visible descriptions for all ~60
                // rules. The Info glyph is the only reason a tooltip
                // exists is discoverable at all (a bare title attribute
                // has zero visual affordance).
                <label
                  key={rule.key}
                  title={rule.description}
                  className="flex items-center gap-1.5 text-[12px]"
                  style={{ color: TEXT }}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(rule.key)}
                    onChange={(e) => onToggle(rule.key, e.target.checked)}
                  />
                  {rule.label}
                  <Info size={11} style={{ color: MUTED }} />
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const PANEL_BG = "#05070a";

// A custom listbox, not a native <select> — matches Console.tsx's
// ScenarioPicker and HudDatePicker's own established reasoning: the
// native popup's list styling is mostly browser/OS-controlled and can't
// be made to match the HUD look. No persistent "current value" to show
// (unlike ScenarioPicker) since applying a role is a one-shot bulk-apply
// action, not a stored, ongoing selection — the button always reads
// "Apply role…".
function RoleSelect({ onApply }: { onApply: (role: GroupRoleKey) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function commit(role: GroupRoleKey) {
    onApply(role);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        className="flex items-center gap-2 border bg-transparent px-3 py-2 text-[13px] outline-none"
        style={{ borderColor: LINE, color: MUTED }}
      >
        Apply role…
        <span aria-hidden="true" style={{ color: ACCENT, transform: open ? "rotate(180deg)" : undefined }}>
          ▾
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute top-full left-0 z-10 mt-1 max-h-64 w-48 overflow-auto border text-[13px]"
          style={{ borderColor: LINE, background: PANEL_BG }}
        >
          {GROUP_ROLE_KEYS.map((role) => (
            <li
              key={role}
              role="option"
              aria-selected={false}
              onClick={() => commit(role)}
              className="cursor-pointer px-3 py-2"
              style={{ color: TEXT }}
              onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.color = TEXT)}
            >
              {ROLE_LABELS[role]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AdminGroup() {
  const { groupId } = useParams<{ groupId: string }>();
  const [data, setData] = useState<MembersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  // Tier text field hidden for now (2026-09-28) — the new role/rules
  // catalog covers the escalation-tier distinction it used to stand in
  // for. Not removed from the data model: existing memberships' tier
  // values still round-trip and display in the members table below.
  const [inviteRules, setInviteRules] = useState<GroupRuleKey[]>([]);
  const [showInviteRules, setShowInviteRules] = useState(false);
  const [inviting, setInviting] = useState(false);

  function reload() {
    if (!groupId) return;
    apiFetch<MembersResponse>(`/api/admin/groups/${groupId}/members`).then(setData, (err) => setError(err.message));
  }

  useEffect(reload, [groupId]);

  const [allUsers, setAllUsers] = useState<AdminUserOption[]>([]);
  const [addUserId, setAddUserId] = useState("");
  const [addRules, setAddRules] = useState<GroupRuleKey[]>([]);
  const [showAddRules, setShowAddRules] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    apiFetch<AdminUserOption[]>("/api/admin/users").then(setAllUsers, () => {});
  }, []);

  // Everyone except active members — a revoked member is still offered,
  // since adding them reactivates that membership.
  const activeMemberIds = new Set((data?.members ?? []).filter((m) => m.status === "active").map((m) => m.userId));
  const revokedMemberIds = new Set((data?.members ?? []).filter((m) => m.status === "revoked").map((m) => m.userId));
  const addCandidates = allUsers.filter((u) => !activeMemberIds.has(u.id));

  async function addExistingUser() {
    if (!groupId || !addUserId) return;
    setAdding(true);
    setError(null);
    try {
      await apiFetch(`/api/admin/groups/${groupId}/memberships`, {
        method: "POST",
        body: JSON.stringify({ userId: addUserId, rules: addRules }),
      });
      setAddUserId("");
      setAddRules([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to add user");
    } finally {
      // Reload on failure too — a 409 means they're already an active
      // member, which is the real state this view should show.
      setAdding(false);
      reload();
    }
  }

  async function invite() {
    if (!groupId || !inviteEmail.trim()) return;
    setInviting(true);
    setError(null);
    try {
      await apiFetch(`/api/admin/groups/${groupId}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim(), tier: null, rules: inviteRules }),
      });
      setInviteEmail("");
      setInviteRules([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to invite");
    } finally {
      // Reload on failure too, not just success — e.g. a 409 conflict
      // means someone else already has whatever access this invite
      // attempted to grant, which is exactly the current, real state
      // this view should reflect rather than sit stale on.
      setInviting(false);
      reload();
    }
  }

  async function cancelInvitation(id: string) {
    if (!groupId) return;
    setError(null);
    try {
      await apiFetch(`/api/admin/groups/${groupId}/invitations/${id}`, { method: "DELETE" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to cancel invitation");
    } finally {
      // Also reload on a 404 "already accepted" — the invitee accepted
      // between page load and this click, so this view was already
      // stale before the click; the fix is showing the real state now,
      // not leaving it stuck on "pending" until a manual refresh.
      reload();
    }
  }

  async function revoke(membershipId: string) {
    if (!groupId) return;
    setError(null);
    try {
      await apiFetch(`/api/admin/groups/${groupId}/memberships/${membershipId}/revoke`, { method: "PATCH" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to revoke membership");
    } finally {
      reload();
    }
  }

  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  async function updateMemberRules(membershipId: string, rules: readonly string[]) {
    if (!groupId) return;
    setError(null);
    try {
      await apiFetch(`/api/admin/groups/${groupId}/memberships/${membershipId}`, {
        method: "PATCH",
        body: JSON.stringify({ rules }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to update rules");
    } finally {
      reload();
    }
  }

  return (
    <HudPageShell>
      <div className="relative mx-auto flex max-w-[960px] flex-col gap-6">
        <div>
          <Link to="/admin/users-and-groups" className="text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
            Admin
          </Link>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight">Group members</h1>
        </div>

        {error && <p className="text-[12px] text-red-400">{error}</p>}

        <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
          <h2 className="mb-3 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
            Add existing user
          </h2>
          <div className="mb-3 flex gap-2">
            <select
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
              className="flex-1 border bg-transparent px-3 py-2 text-[13px] outline-none"
              style={{ borderColor: LINE, color: TEXT }}
            >
              <option value="" style={{ background: "#0b1214" }}>
                {addCandidates.length === 0 ? "Everyone is already a member" : "Select a user…"}
              </option>
              {addCandidates.map((u) => (
                <option key={u.id} value={u.id} style={{ background: "#0b1214" }}>
                  {u.name ? `${u.name} — ${u.email}` : u.email}
                  {revokedMemberIds.has(u.id) ? " (revoked)" : ""}
                </option>
              ))}
            </select>
            <RoleSelect onApply={(role) => setAddRules([...GROUP_ROLE_DEFAULT_RULES[role]])} />
            <button
              type="button"
              onClick={addExistingUser}
              disabled={adding || !addUserId}
              className="border px-3 py-2 text-[13px] disabled:opacity-40"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              Add
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowAddRules((wasShown) => !wasShown)}
            className="text-[12px]"
            style={{ color: MUTED }}
          >
            {showAddRules ? "Hide rules" : "Customize rules"} ({addRules.length})
          </button>
          {showAddRules && (
            <div className="mt-3">
              <RuleChecklist
                selected={addRules}
                onToggle={(rule, checked) =>
                  setAddRules((prev) => (checked ? [...prev, rule] : prev.filter((r) => r !== rule)))
                }
              />
            </div>
          )}
        </section>

        <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
          <h2 className="mb-3 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
            Invite
          </h2>
          <div className="mb-3 flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 border bg-transparent px-3 py-2 text-[13px] outline-none"
              style={{ borderColor: LINE, color: TEXT }}
            />
            <RoleSelect onApply={(role) => setInviteRules([...GROUP_ROLE_DEFAULT_RULES[role]])} />
            <button
              type="button"
              onClick={invite}
              disabled={inviting || !inviteEmail.trim()}
              className="border px-3 py-2 text-[13px] disabled:opacity-40"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              Invite
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowInviteRules((wasShown) => !wasShown)}
            className="text-[12px]"
            style={{ color: MUTED }}
          >
            {showInviteRules ? "Hide rules" : "Customize rules"} ({inviteRules.length})
          </button>
          {showInviteRules && (
            <div className="mt-3">
              <RuleChecklist
                selected={inviteRules}
                onToggle={(rule, checked) =>
                  setInviteRules((prev) => (checked ? [...prev, rule] : prev.filter((r) => r !== rule)))
                }
              />
            </div>
          )}
        </section>

        {data?.pendingInvitations && data.pendingInvitations.length > 0 && (
          <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
            <h2 className="mb-3 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
              Pending invitations
            </h2>
            <div className="flex flex-col gap-1.5">
              {data.pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between border px-3 py-2 text-[13px]" style={{ borderColor: LINE }}>
                  <span style={{ color: TEXT }}>{invitation.email}</span>
                  <button
                    type="button"
                    onClick={() => cancelInvitation(invitation.id)}
                    className="border px-2 py-1 text-[12px]"
                    style={{ borderColor: LINE, color: MUTED }}
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
          <h2 className="mb-3 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
            Members
          </h2>
          {data === null ? (
            <p className="text-[13px]" style={{ color: MUTED }}>
              Loading…
            </p>
          ) : data.members.length === 0 ? (
            <p className="text-[13px]" style={{ color: MUTED }}>
              No members yet.
            </p>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr style={{ color: MUTED }}>
                  <th className="border-b pb-2 font-normal" style={{ borderColor: LINE }}>
                    Name
                  </th>
                  <th className="border-b pb-2 font-normal" style={{ borderColor: LINE }}>
                    Email
                  </th>
                  <th className="border-b pb-2 font-normal" style={{ borderColor: LINE }}>
                    Tier
                  </th>
                  <th className="border-b pb-2 font-normal" style={{ borderColor: LINE }}>
                    Status
                  </th>
                  <th className="border-b pb-2 text-right font-normal" style={{ borderColor: LINE }} />
                </tr>
              </thead>
              <tbody>
                {data.members.map((member) => (
                  <Fragment key={member.id}>
                    <tr>
                      <td className="border-b py-2" style={{ borderColor: LINE, color: TEXT }}>
                        {member.name}
                      </td>
                      <td className="border-b py-2" style={{ borderColor: LINE, color: TEXT }}>
                        {member.email}
                      </td>
                      <td className="border-b py-2" style={{ borderColor: LINE, color: MUTED }}>
                        {member.tier ?? "—"}
                      </td>
                      <td className="border-b py-2" style={{ borderColor: LINE, color: member.status === "active" ? ACCENT : MUTED }}>
                        {member.status}
                      </td>
                      <td className="border-b py-2 text-right" style={{ borderColor: LINE }}>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedMemberId(expandedMemberId === member.id ? null : member.id)}
                            className="border px-2 py-1 text-[12px]"
                            style={{ borderColor: expandedMemberId === member.id ? ACCENT : LINE, color: expandedMemberId === member.id ? ACCENT : MUTED }}
                          >
                            Rules ({member.rules.length})
                          </button>
                          {member.status === "active" && (
                            <button
                              type="button"
                              onClick={() => revoke(member.id)}
                              className="border px-2 py-1 text-[12px]"
                              style={{ borderColor: LINE, color: MUTED }}
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedMemberId === member.id && (
                      <tr>
                        <td colSpan={5} className="border-b py-3" style={{ borderColor: LINE }}>
                          <div className="mb-2">
                            <RoleSelect onApply={(role) => updateMemberRules(member.id, GROUP_ROLE_DEFAULT_RULES[role])} />
                          </div>
                          <RuleChecklist
                            selected={member.rules}
                            onToggle={(rule, checked) =>
                              updateMemberRules(
                                member.id,
                                checked ? [...member.rules, rule] : member.rules.filter((r) => r !== rule),
                              )
                            }
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
      <HudFloorNav />
    </HudPageShell>
  );
}
