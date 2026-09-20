## 1. Schema (packages/shared)

- [x] 1.1 Add `RealtimePingSnapshotSchema` and optional `World.realtimePings: RealtimePingSnapshotSchema[]`
- [x] 1.2 Add optional `World.deviceBackups: { label: string; at: string }[]`
- [x] 1.3 Add optional `WorldSeries.throughputTx1h: SeriesRefSchema`
- [x] 1.4 Verify unit tests cover a `World` both with and without each new field

## 2. New dashboard components (packages/dashboards)

- [x] 2.1 Add `crm/RealtimePingModal.tsx` (`{world, targetLabel}`)
- [x] 2.2 Add `nms/DeviceOverview.tsx` (`{world}`) — RX/TX throughput over the shared 1h window
- [x] 2.3 Add `nms/DeviceManagePane.tsx` (`{world}`) — device/subscriber info + backups list
- [x] 2.4 Add `nms/ApStationList.tsx` (`{world}`) — station table with current-customer row highlighted
- [x] 2.5 Export all four from `packages/dashboards`' index; verify typecheck passes

## 3. Case 001 world content (packages/cases)

- [x] 3.1 Swap `world.ts`'s `throughputRx1h` from the placeholder `noisyCeiling` to `shaperCollapse({at: "11:56", toKbps: 50})`; add `throughputTx1h` with the same params
- [x] 3.2 Add the two `WorldEvent`s (`11:52` config change, `11:56` collapse) to `world.events`; verify `validateWorld` produces no new hard tensions
- [x] 3.3 Add `realtimePings` (customer + Lakeside Inn snapshots) and `deviceBackups` to `world.ts`
- [x] 3.4 Add M. Ferrier's own `StationRow` (`isCurrentCustomer: true`, post-fix values) to `stationList`

## 4. Case 001 stages 6-10 (packages/cases)

- [x] 4.1 Author stage 6 ("You changed the plan." — ticketNote + 3× colleagueSays; hypothesis/hybrid prompt) per outline §9
- [x] 4.2 Author stage 7 ("Is she online?" — two `RealtimePingModal`s; whatChanged prompt, freeText rubric)
- [x] 4.3 Author stage 8 ("I haven't done anything but I see traffic." — `DeviceOverview`; hypothesis/hybrid prompt)
- [x] 4.4 Author stage 9 ("Get it back." — `DeviceManagePane`; action prompt, options rubric)
- [x] 4.5 Author stage 10 ("It's back." — `ApStationList`; ticketNote prompt, freeText rubric)
- [x] 4.6 Insert stages 6-10 into case 001's `stages` array after `s5`
- [x] 4.7 Rewrite the debrief to cover both the foliage arc and the shaper-collapse incident; add a `DeviceOverview` replay (no per-point annotation on it — its insight is about the whole-window RX/TX pattern, not a single instant, same reasoning already applied to the 24h capacity chart)
- [x] 4.8 Update case 001's `tags`/`gotchas`/`estimatedMinutes` to reflect the full 10-stage case
- [x] 4.9 Verify the full `Case` object validates end to end and `pnpm --filter @noisefloor/cases test` passes with the new stage order

## 5. Case player UI (apps/web)

- [x] 5.1 Extend `CasePlayer`'s `EvidenceView` with `crm/RealtimePingModal` (passing `worldSlice` as `targetLabel`) and `nms/*` branches
- [x] 5.2 Add gallery entries for all four new components to `DevGallery`
- [x] 5.3 Add Playwright visual snapshots for all four — scoped to each component's own `<section>` from the start, per `dashboard-visual-richness`'s lesson about page-level coupling

## 6. Verification

- [x] 6.1 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` at the repo root; verify all three pass. Also fixed two `apps/api` route tests hardcoded to the old 5-stage sequence — they now walk the full 10-stage path and assert the correct revision-bonus total (29)
- [x] 6.2 Manually play case 001 end to end (stages 1→10→debrief) — played locally via a scripted browser session against a real local Postgres/auth stack (no production email round-trip needed); total score 29, matching the automated test exactly
