import { useEffect, useState } from "react";
import { Link } from "react-router";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";
import { apiFetch } from "../lib/api";

const LINE = "#1c2a2e";
const TEXT = "#d7e6e2";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";

type ExternalSystem = "genieacs" | "uisp";
type DeviceTag = { id: string; externalSystem: ExternalSystem; externalDeviceId: string };
type Site = { id: string; address: string; deviceTags: DeviceTag[] };
type Customer = { id: string; name: string; contactEmail: string | null; contactPhone: string | null; sites: Site[] };

function NewCustomerForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function create() {
    if (!name.trim() || !address.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await apiFetch("/api/admin/customers", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          contactEmail: contactEmail.trim() || null,
          contactPhone: contactPhone.trim() || null,
          site: { address: address.trim() },
        }),
      });
      setName("");
      setAddress("");
      setContactEmail("");
      setContactPhone("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to create customer");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
      <h2 className="mb-3 text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
        New customer
      </h2>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Customer name…"
          className="border bg-transparent px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: LINE, color: TEXT }}
        />
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Site address…"
          className="border bg-transparent px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: LINE, color: TEXT }}
        />
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="Contact email (optional)…"
          className="border bg-transparent px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: LINE, color: TEXT }}
        />
        <input
          type="text"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="Contact phone (optional)…"
          className="border bg-transparent px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: LINE, color: TEXT }}
        />
      </div>

      <button
        type="button"
        onClick={create}
        disabled={creating || !name.trim() || !address.trim()}
        className="mt-3 border px-3 py-2 text-[13px] disabled:opacity-40"
        style={{ borderColor: ACCENT, color: ACCENT }}
      >
        Create
      </button>

      {error && <p className="mt-3 text-[12px] text-red-400">{error}</p>}
    </section>
  );
}

function AddSiteRow({ customerId, onAdded }: { customerId: string; onAdded: () => void }) {
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function add() {
    if (!address.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await apiFetch(`/api/admin/customers/${customerId}/sites`, { method: "POST", body: JSON.stringify({ address: address.trim() }) });
      setAddress("");
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to add site");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="New site address…"
          className="flex-1 border bg-transparent px-2 py-1 text-[12px] outline-none"
          style={{ borderColor: LINE, color: TEXT }}
        />
        <button
          type="button"
          onClick={add}
          disabled={adding || !address.trim()}
          className="border px-2 py-1 text-[12px] disabled:opacity-40"
          style={{ borderColor: ACCENT, color: ACCENT }}
        >
          Add site
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

function TagDeviceRow({ siteId, onTagged }: { siteId: string; onTagged: () => void }) {
  const [externalSystem, setExternalSystem] = useState<ExternalSystem>("genieacs");
  const [externalDeviceId, setExternalDeviceId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tagging, setTagging] = useState(false);

  async function tag() {
    if (!externalDeviceId.trim()) return;
    setTagging(true);
    setError(null);
    try {
      await apiFetch(`/api/admin/sites/${siteId}/device-tags`, {
        method: "POST",
        body: JSON.stringify({ externalSystem, externalDeviceId: externalDeviceId.trim() }),
      });
      setExternalDeviceId("");
      onTagged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to tag device");
    } finally {
      setTagging(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        {(["genieacs", "uisp"] as const).map((system) => (
          <button
            key={system}
            type="button"
            onClick={() => setExternalSystem(system)}
            className="border px-2 py-1 text-[11px] uppercase"
            style={{ borderColor: externalSystem === system ? ACCENT : LINE, color: externalSystem === system ? ACCENT : MUTED }}
          >
            {system}
          </button>
        ))}
        <input
          type="text"
          value={externalDeviceId}
          onChange={(e) => setExternalDeviceId(e.target.value)}
          placeholder="Device ID…"
          className="flex-1 border bg-transparent px-2 py-1 text-[12px] outline-none"
          style={{ borderColor: LINE, color: TEXT }}
        />
        <button
          type="button"
          onClick={tag}
          disabled={tagging || !externalDeviceId.trim()}
          className="border px-2 py-1 text-[12px] disabled:opacity-40"
          style={{ borderColor: ACCENT, color: ACCENT }}
        >
          Tag
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

function CustomerCard({ customer, onChanged }: { customer: Customer; onChanged: () => void }) {
  return (
    <div className="border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold" style={{ color: TEXT }}>
          {customer.name}
        </span>
        {(customer.contactEmail || customer.contactPhone) && (
          <span className="text-[11px]" style={{ color: MUTED }}>
            {[customer.contactEmail, customer.contactPhone].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {customer.sites.map((site) => (
          <div key={site.id} className="border-l-2 pl-3" style={{ borderColor: LINE }}>
            <div className="text-[13px]" style={{ color: TEXT }}>
              {site.address}
            </div>
            {site.deviceTags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {site.deviceTags.map((tag) => (
                  <span key={tag.id} className="border px-1.5 py-0.5 text-[11px]" style={{ borderColor: LINE, color: MUTED }}>
                    {tag.externalSystem}: {tag.externalDeviceId}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-2">
              <TagDeviceRow siteId={site.id} onTagged={onChanged} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <AddSiteRow customerId={customer.id} onAdded={onChanged} />
      </div>
    </div>
  );
}

export function Customers() {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    apiFetch<Customer[]>("/api/admin/customers").then(setCustomers, (err) => setError(err.message));
  }

  useEffect(reload, []);

  return (
    <HudPageShell>
      <div className="relative mx-auto flex max-w-[960px] flex-col gap-6">
        <div>
          <Link to="/hub" className="block text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
            Admin
          </Link>
          <h1 className="mt-3 text-[32px] font-semibold tracking-tight">Customers</h1>
        </div>

        <NewCustomerForm onCreated={reload} />

        {error && <p className="text-[12px] text-red-400">{error}</p>}

        {customers === null ? (
          <p className="text-[13px]" style={{ color: MUTED }}>
            Loading…
          </p>
        ) : customers.length === 0 ? (
          <p className="text-[13px]" style={{ color: MUTED }}>
            No customers yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {customers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} onChanged={reload} />
            ))}
          </div>
        )}
      </div>
      <HudFloorNav />
    </HudPageShell>
  );
}
