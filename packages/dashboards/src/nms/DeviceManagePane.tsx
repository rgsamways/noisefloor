import type { World } from "@noisefloor/shared";

export type DeviceManagePaneProps = {
  world: World;
};

// Renders NOISEFLOOR-OUTLINE.md §7's nms/DeviceManagePane: device name,
// subscriber assignment, and a Backups list (starts collapsed — outline
// §9's stage 9 reveal is specifically "Backups section collapsed", so the
// trainee has to notice/expand it). Read-only: the trainee's actual
// decision happens through the stage's own action prompt, not by
// interacting with this mock. Rounded/shadowed card is the
// dashboard-visual-richness carve-out in homepage/DESIGN-NOTES.md.
export function DeviceManagePane({ world }: DeviceManagePaneProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-foreground p-5 pb-4 font-mono text-xs shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">{world.cpe.model}</span>
        <span className="text-muted">Maintenance mode: off</span>
      </div>
      <span>
        Subscriber: {world.customer.displayName} ({world.customer.accountRef})
      </span>

      <details className="rounded border border-foreground p-2">
        <summary className="cursor-pointer text-muted">Backups ({world.deviceBackups?.length ?? 0})</summary>
        <ul className="mt-2 flex flex-col gap-1">
          {world.deviceBackups?.map((b) => (
            <li key={b.at} className="flex items-center justify-between">
              <span>{b.label}</span>
              <span className="text-muted">{b.at}</span>
            </li>
          ))}
        </ul>
      </details>

      <div className="flex gap-4 text-muted">
        <span>Advanced</span>
        <span>Speed test</span>
      </div>
    </div>
  );
}
