import type { World } from "@noisefloor/shared";

export type ApStationListProps = {
  world: World;
};

const COLUMNS = [
  "MAC",
  "Model",
  "Name",
  "Signal",
  "Remote",
  "Down",
  "Up",
  "Airtime TX",
  "Airtime RX",
  "Connected",
  "Last IP",
  "RX",
  "TX",
] as const;

// Renders NOISEFLOOR-OUTLINE.md §7's nms/ApStationList — the AP's station
// table, reusing World.stationList directly (already schema-complete for
// this: isCurrentCustomer was added when case 001's stationList was first
// authored, anticipating exactly this component). Rounded/shadowed card is
// the dashboard-visual-richness carve-out in homepage/DESIGN-NOTES.md.
export function ApStationList({ world }: ApStationListProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-foreground shadow-sm">
      <table className="w-full font-mono text-[11px]">
        <thead>
          <tr className="border-b border-foreground text-left text-muted">
            {COLUMNS.map((c) => (
              <th key={c} className="whitespace-nowrap px-2 py-2 font-normal">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {world.stationList.map((s) => (
            <tr key={s.mac} className={s.isCurrentCustomer ? "bg-[#e6f0fa]" : undefined}>
              <td className="whitespace-nowrap px-2 py-1.5">{s.mac}</td>
              <td className="whitespace-nowrap px-2 py-1.5">{s.model}</td>
              <td className="whitespace-nowrap px-2 py-1.5">
                {s.name}
                {s.isCurrentCustomer && <span className="ml-1 text-muted">(this customer)</span>}
              </td>
              <td className="whitespace-nowrap px-2 py-1.5">{s.signalDbm} dBm</td>
              <td className="whitespace-nowrap px-2 py-1.5">{s.remoteSignalDbm} dBm</td>
              <td className="whitespace-nowrap px-2 py-1.5">{s.capacityDownMbps} Mbps</td>
              <td className="whitespace-nowrap px-2 py-1.5">{s.capacityUpMbps} Mbps</td>
              <td className="whitespace-nowrap px-2 py-1.5">{s.airtimeTxPct}%</td>
              <td className="whitespace-nowrap px-2 py-1.5">{s.airtimeRxPct}%</td>
              <td className="whitespace-nowrap px-2 py-1.5">{s.connectionTime}</td>
              <td className="whitespace-nowrap px-2 py-1.5">{s.lastIp}</td>
              <td className="whitespace-nowrap px-2 py-1.5">{s.throughputRxMbps} Mbps</td>
              <td className="whitespace-nowrap px-2 py-1.5">{s.throughputTxMbps} Mbps</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
