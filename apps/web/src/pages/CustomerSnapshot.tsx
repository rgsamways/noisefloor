import { Link, useLocation } from "react-router";
import { GenieAcsDeviceCard } from "../components/GenieAcsDeviceCard";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";
import { UispDeviceCard } from "../components/UispDeviceCard";

const LINE = "#1c2a2e";
const MUTED = "#5a726e";
const ACCENT = "#3dffc4";

type DeviceTag = { id: string; externalSystem: "genieacs" | "uisp"; externalDeviceId: string };
type Site = { id: string; address: string; deviceTags: DeviceTag[] };
type CustomerSnapshotData = {
  customer: { id: string; name: string; contactEmail: string | null; contactPhone: string | null };
  sites: Site[];
};

// The search result is handed over via router state rather than a
// separate by-id fetch — the search endpoint (task 4.3) already returns
// the full snapshot shape on a match, so there's no need for a second
// backend round trip. Trade-off: a hard refresh or a bookmarked link
// loses the snapshot (no by-id endpoint exists yet) — acceptable for
// this first slice per design.md's "a lot of refining ahead."
export function CustomerSnapshot() {
  const location = useLocation();
  const snapshot = location.state as CustomerSnapshotData | undefined;

  return (
    <HudPageShell>
      <div className="relative mx-auto flex max-w-[960px] flex-col gap-6">
        <div>
          <Link to="/tickets" className="block text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
            Tickets
          </Link>
          <h1 className="mt-3 text-[32px] font-semibold tracking-tight">{snapshot?.customer.name ?? "Customer"}</h1>
        </div>

        {!snapshot ? (
          <div className="flex flex-col gap-3 border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
            <p className="text-[13px]" style={{ color: MUTED }}>
              This snapshot isn't available directly by link yet — search for the customer again from Tickets.
            </p>
            <Link to="/tickets" className="text-[13px]" style={{ color: ACCENT }}>
              Back to Tickets
            </Link>
          </div>
        ) : (
          <>
            {(snapshot.customer.contactEmail || snapshot.customer.contactPhone) && (
              <p className="text-[13px]" style={{ color: MUTED }}>
                {[snapshot.customer.contactEmail, snapshot.customer.contactPhone].filter(Boolean).join(" · ")}
              </p>
            )}

            {snapshot.sites.length === 0 ? (
              <p className="text-[13px]" style={{ color: MUTED }}>
                No sites on file for this customer.
              </p>
            ) : (
              snapshot.sites.map((site) => (
                <section key={site.id} className="flex flex-col gap-4 border p-4" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
                  <h2 className="text-[11px] tracking-[0.1em] uppercase" style={{ color: ACCENT }}>
                    Site — {site.address}
                  </h2>

                  {site.deviceTags.length === 0 ? (
                    <p className="text-[13px]" style={{ color: MUTED }}>
                      No devices tagged to this site yet.
                    </p>
                  ) : (
                    site.deviceTags.map((tag) =>
                      tag.externalSystem === "genieacs" ? (
                        <GenieAcsDeviceCard key={tag.id} deviceId={tag.externalDeviceId} titlePrefix="Router" />
                      ) : (
                        <UispDeviceCard key={tag.id} deviceId={tag.externalDeviceId} titlePrefix="Radio" />
                      ),
                    )
                  )}
                </section>
              ))
            )}
          </>
        )}
      </div>
      <HudFloorNav />
    </HudPageShell>
  );
}
