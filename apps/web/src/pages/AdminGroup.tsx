import { useEffect, useState } from "react";
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

export function AdminGroup() {
  const { groupId } = useParams<{ groupId: string }>();
  const [data, setData] = useState<MembersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteTier, setInviteTier] = useState("");
  const [inviting, setInviting] = useState(false);

  function reload() {
    if (!groupId) return;
    apiFetch<MembersResponse>(`/api/admin/groups/${groupId}/members`).then(setData, (err) => setError(err.message));
  }

  useEffect(reload, [groupId]);

  async function invite() {
    if (!groupId || !inviteEmail.trim()) return;
    setInviting(true);
    setError(null);
    try {
      await apiFetch(`/api/admin/groups/${groupId}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim(), tier: inviteTier.trim() || null }),
      });
      setInviteEmail("");
      setInviteTier("");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to invite");
    } finally {
      setInviting(false);
    }
  }

  async function cancelInvitation(id: string) {
    if (!groupId) return;
    setError(null);
    try {
      await apiFetch(`/api/admin/groups/${groupId}/invitations/${id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to cancel invitation");
    }
  }

  async function revoke(membershipId: string) {
    if (!groupId) return;
    setError(null);
    try {
      await apiFetch(`/api/admin/groups/${groupId}/memberships/${membershipId}/revoke`, { method: "PATCH" });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to revoke membership");
    }
  }

  return (
    <HudPageShell>
      <div className="relative mx-auto flex max-w-[960px] flex-col gap-6">
        <div>
          <Link to="/admin" className="text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
            Admin
          </Link>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight">Group members</h1>
        </div>

        {error && <p className="text-[12px] text-red-400">{error}</p>}

        <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
          <h2 className="mb-3 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
            Invite
          </h2>
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 border bg-transparent px-3 py-2 text-[13px] outline-none"
              style={{ borderColor: LINE, color: TEXT }}
            />
            <input
              type="text"
              value={inviteTier}
              onChange={(e) => setInviteTier(e.target.value)}
              placeholder="tier (optional)"
              className="w-32 border bg-transparent px-3 py-2 text-[13px] outline-none"
              style={{ borderColor: LINE, color: TEXT }}
            />
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
                  <tr key={member.id}>
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
                    </td>
                  </tr>
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
