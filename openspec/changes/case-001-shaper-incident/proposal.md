## Why

Case 001 currently plays stages 1-5 (the capacity/foliage arc). `PROJECT-PLAN.md`'s Phase 3 row calls for completing it to all 10 stages plus the `nms/*` family. Stages 6-10 are a structurally separate incident from the foliage story — per outline §9's `World`, a T1 sets a shaper on the CPE, throughput collapses to a trickle, ping still looks fine (starved management channel, not a real outage), and it has to get traced and restored — testing a different skill (multi-tech incident chasing) than stages 1-5 did.

## What Changes

- Add `crm/RealtimePingModal` (RTT/loss snapshot, source/target) and three `nms/*` components: `DeviceOverview` (1h throughput chart, symmetric-traffic tell), `DeviceManagePane` (backups list), `ApStationList` (the station table, reusing `World.stationList` — already schema-complete for this). `ApLinkView` and `nms/*`'s other outline-listed components aren't built — nothing in stages 6-10 reveals them.
- **Schema additions** to `packages/shared`: `World` gains optional `realtimePings` (point-in-time RTT/loss snapshots, for `RealtimePingModal`) and `deviceBackups` (for `DeviceManagePane`); `WorldSeries` gains `throughputTx1h` (parallel to the existing `throughputRx1h`, for `DeviceOverview`'s symmetric-traffic display).
- Case 001's `world.ts`: swap `throughputRx1h`'s generator from the placeholder `noisyCeiling` to the real `shaperCollapse({at: "11:56", toKbps: 50})` outline §9 always intended; add `throughputTx1h` with the same params (symmetric collapse — the "management chatter, not real traffic" tell); add two `WorldEvent`s (`11:52` config change, `11:56` collapse — see design.md for why the other three events in outline §9's list aren't modeled as formal events).
- Author case 001's stages 6-10 and rewrite the debrief to cover both the foliage arc and this incident.

## Capabilities

### New Capabilities
- `crm-dashboard`: the `crm/*` family beyond `LinkCapacityChart` (which keeps its own existing capability) — starts with `RealtimePingModal`.
- `nms-dashboard`: the `nms/*` family — `DeviceOverview`, `DeviceManagePane`, `ApStationList`.

### Modified Capabilities
- `case-content-schema`: `World` gains `realtimePings` and `deviceBackups`; `WorldSeries` gains `throughputTx1h`.

## Impact

- **Affected code**: `packages/dashboards` (four new components), `packages/shared` (`World`/`WorldSeries` schema additions), `packages/cases` (case 001's `world.ts` gains real events/series, stages 6-10, and a rewritten debrief), `apps/web` (`CasePlayer`'s evidence renderer grows `crm`/`nms` branches, gallery entries, visual snapshots).
- **Scope reductions, explicit**: optional branches A/B (outline §9) stay deferred, same as the last two changes. The account plan-upgrade detail (outline's World summary: "plan 35/10 → later 50/10") is dropped — see design.md for why; the shaper misconfiguration is motivated by routine maintenance instead, which doesn't require retroactively changing `customer.plan` and re-validating stages 1-5's already-shipped, already-calibrated numbers against a new plan value.
- **No breaking change**: all new `World`/`WorldSeries` fields are optional/additive; existing case content (gallery fixtures) validates unchanged.
