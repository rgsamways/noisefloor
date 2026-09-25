import { useEffect, useState } from "react";
import { Link } from "react-router";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";
import { apiFetch } from "../lib/api";

const LINE = "#1c2a2e";
const TEXT = "#d7e6e2";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";

type GroupSummary = { id: string; name: string; memberCount: number };
type AdminUser = { id: string; name: string; email: string; siteAdmin: boolean; siteRules: string[] };

function GroupsSection() {
  const [groups, setGroups] = useState<GroupSummary[] | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function reload() {
    apiFetch<GroupSummary[]>("/api/admin/groups").then(setGroups, (err) => setError(err.message));
  }

  useEffect(reload, []);

  async function createGroup() {
    if (!newGroupName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await apiFetch("/api/admin/groups", { method: "POST", body: JSON.stringify({ name: newGroupName.trim() }) });
      setNewGroupName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to create group");
    } finally {
      // Reload on failure too — a 409 conflict means the list is already
      // stale (someone else created that name first), so show the real
      // current state rather than leave it looking like nothing changed.
      setCreating(false);
      reload();
    }
  }

  return (
    <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
      <h2 className="mb-3 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
        Groups
      </h2>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="New group name…"
          className="flex-1 border bg-transparent px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: LINE, color: TEXT }}
        />
        <button
          type="button"
          onClick={createGroup}
          disabled={creating || !newGroupName.trim()}
          className="border px-3 py-2 text-[13px] disabled:opacity-40"
          style={{ borderColor: ACCENT, color: ACCENT }}
        >
          Create
        </button>
      </div>

      {error && <p className="mb-3 text-[12px] text-red-400">{error}</p>}

      {groups === null ? (
        <p className="text-[13px]" style={{ color: MUTED }}>
          Loading…
        </p>
      ) : groups.length === 0 ? (
        <p className="text-[13px]" style={{ color: MUTED }}>
          No groups yet.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {groups.map((group) => (
            <Link
              key={group.id}
              to={`/admin/groups/${group.id}`}
              className="flex items-center justify-between border px-3 py-2 text-[13px] transition-colors"
              style={{ borderColor: LINE, color: TEXT }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = LINE)}
            >
              <span>{group.name}</span>
              <span style={{ color: MUTED }}>{group.memberCount} member{group.memberCount === 1 ? "" : "s"}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function UsersSection() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  function reload() {
    apiFetch<AdminUser[]>("/api/admin/users").then(setUsers, (err) => setError(err.message));
  }

  useEffect(reload, []);

  async function toggleSiteAdmin(target: AdminUser) {
    setSavingId(target.id);
    setError(null);
    try {
      const updated = await apiFetch<AdminUser>(`/api/admin/users/${target.id}`, {
        method: "PATCH",
        body: JSON.stringify({ siteAdmin: !target.siteAdmin }),
      });
      setUsers((prev) => prev?.map((u) => (u.id === updated.id ? updated : u)) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to update user");
      // Reload on failure too — whatever this view thought was true
      // when it loaded may no longer be, so show the real current
      // state rather than leave the stale pre-click value displayed.
      reload();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
      <h2 className="mb-3 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
        Users
      </h2>

      {error && <p className="mb-3 text-[12px] text-red-400">{error}</p>}

      {users === null ? (
        <p className="text-[13px]" style={{ color: MUTED }}>
          Loading…
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
              <th className="border-b pb-2 text-right font-normal" style={{ borderColor: LINE }}>
                Site admin
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="border-b py-2" style={{ borderColor: LINE, color: TEXT }}>
                  {u.name}
                </td>
                <td className="border-b py-2" style={{ borderColor: LINE, color: TEXT }}>
                  {u.email}
                </td>
                <td className="border-b py-2 text-right" style={{ borderColor: LINE }}>
                  <button
                    type="button"
                    onClick={() => toggleSiteAdmin(u)}
                    disabled={savingId === u.id}
                    className="border px-2 py-1 text-[12px] disabled:opacity-40"
                    style={{ borderColor: u.siteAdmin ? ACCENT : LINE, color: u.siteAdmin ? ACCENT : MUTED }}
                  >
                    {u.siteAdmin ? "Yes" : "No"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function Admin() {
  return (
    <HudPageShell>
      <div className="relative mx-auto flex max-w-[960px] flex-col gap-6">
        <div>
          <div className="text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
            Admin
          </div>
          <h1 className="mt-3 text-[32px] font-semibold tracking-tight">Users & groups</h1>
        </div>

        <GroupsSection />
        <UsersSection />
      </div>
      <HudFloorNav />
    </HudPageShell>
  );
}
