import { useState } from "react";
import { Link, useParams } from "react-router";
import { GenieAcsDeviceCard } from "../components/GenieAcsDeviceCard";
import { HudFloorNav } from "../components/HudFloorNav";
import { HudPageShell } from "../components/HudPageShell";

const MUTED = "#5a726e";

export function DeviceDetail() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const [title, setTitle] = useState("Device");

  return (
    <HudPageShell>
      <div className="relative mx-auto flex max-w-[960px] flex-col gap-6">
        <div>
          <Link to="/tickets" className="block text-[11px] tracking-[0.06em] uppercase" style={{ color: MUTED }}>
            Tickets
          </Link>
          <h1 className="mt-3 text-[32px] font-semibold tracking-tight">{title}</h1>
        </div>

        {deviceId && (
          <GenieAcsDeviceCard
            deviceId={deviceId}
            onLoaded={(detail) => setTitle(`${detail.manufacturer ?? "Unknown"} ${detail.productClass ?? ""}`.trim())}
          />
        )}
      </div>
      <HudFloorNav />
    </HudPageShell>
  );
}
