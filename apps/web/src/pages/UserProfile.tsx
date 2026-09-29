import { GROUP_RULE_DOMAINS } from "@noisefloor/shared";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";
import { apiFetch } from "../lib/api";
import { ROLE_LABELS, roleForRules } from "../lib/role-labels";

const LINE = "#1c2a2e";
const TEXT = "#d7e6e2";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";

type Membership = {
  id: string;
  groupId: string;
  groupName: string;
  status: "active" | "revoked";
  tier: string | null;
  rules: string[];
};
type Profile = {
  id: string;
  name: string;
  title: string | null;
  email: string;
  emailVerified: boolean;
  siteAdmin: boolean;
  siteRules: string[];
  memberships: Membership[];
};

const RULE_LABELS = new Map<string, string>(GROUP_RULE_DOMAINS.flatMap((d) => d.rules.map((r) => [r.key, r.label] as const)));

const PANEL = { borderColor: LINE, background: "rgba(255,255,255,0.015)" };

export function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    if (!userId) return;
    apiFetch<Profile>(`/api/admin/users/${userId}`).then(
      (p) => {
        setProfile(p);
        setName(p.name);
        setTitle(p.title ?? "");
      },
      (err) => setError(err.message),
    );
  }

  useEffect(load, [userId]);

  const dirty = profile !== null && (name.trim() !== profile.name || (title.trim() || null) !== profile.title);

  async function save() {
    if (!profile || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/admin/users/${profile.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), title: title.trim() || null }),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function toggleSiteAdmin() {
    if (!profile) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/admin/users/${profile.id}`, {
        method: "PATCH",
        body: JSON.stringify({ siteAdmin: !profile.siteAdmin }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to update site admin");
    } finally {
      setBusy(false);
      // Reload on failure too, so the toggle shows the real current state.
      load();
    }
  }

  async function deleteUser() {
    if (!profile) return;
    if (!window.confirm(`Permanently delete ${profile.email}? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/admin/users/${profile.id}`, { method: "DELETE" });
      navigate("/admin/users-and-groups");
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to delete user");
      setBusy(false);
    }
  }

  return (
    <HudPageShell>
      <div className="relative mx-auto flex max-w-[960px] flex-col gap-6">
        <div>
          <Link to="/admin/users-and-groups" className="text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
            Users & groups
          </Link>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight">{profile ? profile.name : "User profile"}</h1>
        </div>

        {error && <p className="text-[12px] text-red-400">{error}</p>}

        {profile === null ? (
          !error && (
            <p className="text-[13px]" style={{ color: MUTED }}>
              Loading…
            </p>
          )
        ) : (
          <>
            <section className="border p-4" style={PANEL}>
              <h2 className="mb-3 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
                Profile
              </h2>
              <div className="flex flex-col gap-3 text-[13px]">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
                    Name
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border bg-transparent px-3 py-2 outline-none"
                    style={{ borderColor: LINE, color: TEXT }}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
                    Title
                  </span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="—"
                    className="border bg-transparent px-3 py-2 outline-none"
                    style={{ borderColor: LINE, color: TEXT }}
                  />
                </label>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
                    Email
                  </span>
                  <span style={{ color: TEXT }}>
                    {profile.email}{" "}
                    <span style={{ color: profile.emailVerified ? ACCENT : MUTED }}>
                      ({profile.emailVerified ? "verified" : "not yet signed in"})
                    </span>
                  </span>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={save}
                    disabled={busy || !dirty || !name.trim()}
                    className="border px-3 py-2 text-[13px] disabled:opacity-40"
                    style={{ borderColor: ACCENT, color: ACCENT }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </section>

            <section className="border p-4" style={PANEL}>
              <h2 className="mb-3 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
                Access
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-[13px]">
                <span style={{ color: MUTED }}>Site admin</span>
                <button
                  type="button"
                  onClick={toggleSiteAdmin}
                  disabled={busy}
                  className="border px-2 py-1 text-[12px] disabled:opacity-40"
                  style={{ borderColor: profile.siteAdmin ? ACCENT : LINE, color: profile.siteAdmin ? ACCENT : MUTED }}
                >
                  {profile.siteAdmin ? "Yes" : "No"}
                </button>
                <span style={{ color: MUTED }}>Site rules</span>
                <span style={{ color: TEXT }}>
                  {profile.siteRules.length === 0 ? "none" : profile.siteRules.map((r) => RULE_LABELS.get(r) ?? r).join(", ")}
                </span>
              </div>
            </section>

            <section className="border p-4" style={PANEL}>
              <h2 className="mb-3 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
                Groups
              </h2>
              {profile.memberships.length === 0 ? (
                <p className="text-[13px]" style={{ color: MUTED }}>
                  Not in any group.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {profile.memberships.map((m) => {
                    const role = roleForRules(m.rules);
                    return (
                      <div key={m.id} className="border px-3 py-2 text-[13px]" style={{ borderColor: LINE }}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Link to={`/admin/groups/${m.groupId}`} style={{ color: TEXT }}>
                            {m.groupName}
                          </Link>
                          <span className="flex items-center gap-3 text-[12px]">
                            {role && <span style={{ color: ACCENT }}>{ROLE_LABELS[role]}</span>}
                            {m.tier && <span style={{ color: MUTED }}>Tier {m.tier}</span>}
                            <span style={{ color: m.status === "active" ? ACCENT : "#f87171" }}>{m.status}</span>
                          </span>
                        </div>
                        <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
                          {m.rules.length === 0 ? "No rules" : m.rules.map((r) => RULE_LABELS.get(r) ?? r).join(", ")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="flex flex-wrap items-center gap-3">
              <Link
                to={`/admin/users/${profile.id}/reports`}
                className="border px-3 py-2 text-[13px]"
                style={{ borderColor: LINE, color: MUTED }}
              >
                EOD reports
              </Link>
              <button
                type="button"
                onClick={deleteUser}
                disabled={busy}
                className="border px-3 py-2 text-[13px] disabled:opacity-40"
                style={{ borderColor: LINE, color: "#f87171" }}
              >
                Delete user
              </button>
            </section>
          </>
        )}
      </div>
      <HudFloorNav />
    </HudPageShell>
  );
}
