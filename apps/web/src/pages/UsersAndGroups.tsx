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
type AdminUser = { id: string; name: string; title: string | null; email: string; siteAdmin: boolean; siteRules: string[] };

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

  function reload() {
    apiFetch<AdminUser[]>("/api/admin/users").then(setUsers, (err) => setError(err.message));
  }

  useEffect(reload, []);

  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newGroupId, setNewGroupId] = useState("");
  const [newTier, setNewTier] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    apiFetch<GroupSummary[]>("/api/admin/groups").then(setGroups, () => {});
  }, []);

  async function createUser() {
    if (!newEmail.trim() || !newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await apiFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: newEmail.trim(),
          name: newName.trim(),
          title: newTitle.trim() || null,
          ...(newGroupId ? { group: { groupId: newGroupId, tier: newTier.trim() || null } } : {}),
        }),
      });
      setNewEmail("");
      setNewName("");
      setNewTitle("");
      setNewGroupId("");
      setNewTier("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to create user");
    } finally {
      setCreating(false);
      reload();
    }
  }

  return (
    <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
      <h2 className="mb-3 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
        Users
      </h2>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Name"
          className="min-w-[140px] flex-1 border bg-transparent px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: LINE, color: TEXT }}
        />
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Title (optional)"
          className="min-w-[120px] flex-1 border bg-transparent px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: LINE, color: TEXT }}
        />
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Email"
          className="min-w-[200px] flex-1 border bg-transparent px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: LINE, color: TEXT }}
        />
        <select
          value={newGroupId}
          onChange={(e) => setNewGroupId(e.target.value)}
          className="border bg-transparent px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: LINE, color: TEXT }}
        >
          <option value="" style={{ background: "#0b1214" }}>
            No group
          </option>
          {groups.map((g) => (
            <option key={g.id} value={g.id} style={{ background: "#0b1214" }}>
              {g.name}
            </option>
          ))}
        </select>
        {newGroupId && (
          <input
            type="text"
            value={newTier}
            onChange={(e) => setNewTier(e.target.value)}
            placeholder="Tier (optional)"
            className="w-[120px] border bg-transparent px-3 py-2 text-[13px] outline-none"
            style={{ borderColor: LINE, color: TEXT }}
          />
        )}
        <button
          type="button"
          onClick={createUser}
          disabled={creating || !newEmail.trim() || !newName.trim()}
          className="border px-3 py-2 text-[13px] disabled:opacity-40"
          style={{ borderColor: ACCENT, color: ACCENT }}
        >
          Create user
        </button>
      </div>

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
                Title
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
                {[u.name, u.title ?? "", u.email].map((value, i) => {
                  const empty = !value;
                  const base = empty ? MUTED : TEXT;
                  return (
                    <td key={i} className="border-b py-2 pr-3" style={{ borderColor: LINE }}>
                      <Link
                        to={`/admin/users/${u.id}`}
                        className="block transition-colors"
                        style={{ color: base }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = base)}
                      >
                        {empty ? "—" : value}
                      </Link>
                    </td>
                  );
                })}
                <td className="border-b py-2 text-right" style={{ borderColor: LINE, color: u.siteAdmin ? ACCENT : MUTED }}>
                  {u.siteAdmin ? "Yes" : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function UsersAndGroups() {
  return (
    <HudPageShell>
      <div className="relative mx-auto flex max-w-[960px] flex-col gap-6">
        <div>
          <Link to="/hub" className="block text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
            Admin
          </Link>
          <h1 className="mt-3 text-[32px] font-semibold tracking-tight">Users & groups</h1>
        </div>

        <GroupsSection />
        <UsersSection />
      </div>
      <HudFloorNav />
    </HudPageShell>
  );
}
