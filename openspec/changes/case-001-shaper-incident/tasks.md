## 1. Schema (packages/shared)

- [ ] 1.1 Add `RealtimePingSnapshotSchema` and optional `World.realtimePings: RealtimePingSnapshotSchema[]`
- [ ] 1.2 Add optional `World.deviceBackups: { label: string; at: string }[]`
- [ ] 1.3 Add optional `WorldSeries.throughputTx1h: SeriesRefSchema`
- [ ] 1.4 Verify unit tests cover a `World` both with and without each new field

## 2. New dashboard components (packages/dashboards)

- [ ] 2.1 Add `crm/RealtimePingModal.tsx` (`{world, targetLabel}`)
- [ ] 2.2 Add `nms/DeviceOverview.tsx` (`{world}`) — RX/TX throughput over the shared 1h window
- [ ] 2.3 Add `nms/DeviceManagePane.tsx` (`{world}`) — device/subscriber info + backups list
- [ ] 2.4 Add `nms/ApStationList.tsx` (`{world}`) — station table with current-customer row highlighted
- [ ] 2.5 Export all four from `packages/dashboards`' index; verify typecheck passes

## 3. Case 001 world content (packages/cases)

- [ ] 3.1 Swap `world.ts`'s `throughputRx1h` from the placeholder `noisyCeiling` to `shaperCollapse({at: "11:56", toKbps: 50})`; add `throughputTx1h` with the same params
- [ ] 3.2 Add the two `WorldEvent`s (`11:52` config change, `11:56` collapse) to `world.events`; verify `validateWorld` produces no new hard tensions
- [ ] 3.3 Add `realtimePings` (customer + Lakeside Inn snapshots) and `deviceBackups` to `world.ts`
- [ ] 3.4 Add M. Ferrier's own `StationRow` (`isCurrentCustomer: true`, post-fix values) to `stationList`

## 4. Case 001 stages 6-10 (packages/cases)

- [ ] 4.1 Author stage 6 ("You changed the plan." — ticketNote + 3× colleagueSays; hypothesis/hybrid prompt) per outline §9
- [ ] 4.2 Author stage 7 ("Is she online?" — two `RealtimePingModal`s; whatChanged prompt, freeText rubric)
- [ ] 4.3 Author stage 8 ("I haven't done anything but I see traffic." — `DeviceOverview`; hypothesis/hybrid prompt)
- [ ] 4.4 Author stage 9 ("Get it back." — `DeviceManagePane`; action prompt, options rubric)
- [ ] 4.5 Author stage 10 ("It's back." — `ApStationList`; ticketNote prompt, freeText rubric)
- [ ] 4.6 Insert stages 6-10 into case 001's `stages` array after `s5`
- [ ] 4.7 Rewrite the debrief to cover both the foliage arc and the shaper-collapse incident; add an annotation on `throughputRx1h`/`throughputTx1h` at `11:56`
- [ ] 4.8 Update case 001's `tags`/`gotchas`/`estimatedMinutes` to reflect the full 10-stage case
- [ ] 4.9 Verify the full `Case` object validates end to end and `pnpm --filter @noisefloor/cases test` passes

## 5. Case player UI (apps/web)

- [ ] 5.1 Extend `CasePlayer`'s `EvidenceView` with `crm/RealtimePingModal` (passing `worldSlice` as `targetLabel`) and `nms/*` branches
- [ ] 5.2 Add gallery entries for all four new components to `DevGallery`
- [ ] 5.3 Add Playwright visual snapshots for all four

## 6. Verification

- [ ] 6.1 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` at the repo root; verify all three pass
- [ ] 6.2 Manually play case 001 end to end (stages 1→10→debrief) against the deployed API
