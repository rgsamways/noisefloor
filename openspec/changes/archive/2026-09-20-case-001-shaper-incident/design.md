## Context

See `proposal.md`. Case 001's `world.ts` already has a `throughputRx1h` field intentionally left as a steady placeholder, with a comment explaining exactly why: three of outline §9's five events (`11:21 UISP reconnect`, `12:34 T2 restore`, `12:35 CPE reboot`) don't have a modeled series effect, and `world-consistency-validator`'s event-coherence rule (`checkEventCoherence`) would flag any `WorldEvent` with no visible change in a comparable series as a hard tension. This change resolves that by checking what the rule actually requires, rather than assuming all five events need a modeled effect.

## Goals / Non-Goals

**Goals:**
- Case 001 playable end-to-end, stages 1-10, one continuous attempt.
- The shaper-collapse incident modeled with a real, validator-passing `WorldEvent` pair, using the `shaperCollapse` generator outline §9 always specified (built in Phase 0, never used until now).
- `RealtimePingModal`, `DeviceOverview`, `DeviceManagePane`, `ApStationList` built against `World` data alone, same discipline as every prior dashboard component.

**Non-Goals:**
- Optional branches A/B — still deferred.
- `ApLinkView` and the rest of outline §7's `nms`/`crm` inventory not revealed by any of stages 1-10 — built when a stage actually needs them, not speculatively.
- The account plan-upgrade detail — dropped, see Decisions.

## Decisions

**Only two `WorldEvent`s are added: the `11:52` config change and the `11:56` collapse.** Traced `checkEventCoherence`/`hasVisibleChangeAt` directly against `shaperCollapse`'s actual output: `shaperCollapse({at: "11:56", toKbps: 50})` produces a one-hour window (11:26-12:26) that's flat baseline before `11:56` and flat-collapsed after. Both `11:52` and `11:56` fall inside that window with a real, large (>15% threshold) drop somewhere after each of them in `throughputRx1h` — they pass validation for real, not by accident.

The other three events from outline §9's list (`11:21` reconnect, `12:34` restore, `12:35` reboot) are **not** added as `WorldEvent`s:
- `11:21` falls *before* the `shaperCollapse` window starts (11:26) — no covering series shows any change at or after it, so it would fail `checkEventCoherence` for real (not the `null`/inconclusive case).
- `12:34`/`12:35` fall *after* the window ends (12:26) — same problem, and `shaperCollapse` has no built-in recovery phase to model a restore within the window (it stays collapsed for the full hour).
- Modeling all five would mean either widening the window artificially (past what the outline's own hour-centered collapse describes) or adding fake bumps with no real narrative content, purely to satisfy the validator — the same "honest scope" call already made once for this exact field.

These three events are still part of the story — conveyed as **narrative evidence** (`colleagueSays`/`ticketNote` text in stages 6, 9, and 10), not as formal `WorldEvent`s. `WorldEvent`/`world.events` is specifically the mechanism the *validator* checks for numeric coherence; a colleague saying "I reconnected it at 11:21 but lost it again" doesn't need to independently prove itself against a time-series the way a structured `WorldEvent` does.

**`throughputTx1h` is a new `WorldSeries` key, not a derived value.** `DeviceOverview`'s "symmetric traffic = management chatter, not a real session" tell needs RX and TX to visibly match during the collapse. Reusing `shaperCollapse` with the same `at`/`toKbps` for both RX and TX produces exactly that (both collapse to the same value at the same time) — simpler and more honest than inventing a derived "TX equals RX" rule inside the generator itself.

**`RealtimePingModal` reads from a new `World.realtimePings` array, not component props.** Per `case-content-schema`'s existing rule ("no dashboard component shall require data outside of a World or a named slice of one"), the two ping snapshots stage 7 reveals (customer, "Lakeside Inn") are `World`-level data: `{ targetLabel: string, rttMs: number, lossPct: number, avgRttMs?: number }[]`. The component takes `{ world, targetLabel }` and looks up its own entry — same pattern as `DeviceDetails`'s `{ world, side }`.

**`ApStationList` needs no new schema** — `StationRow` already has everything outline §7 lists for it, including `isCurrentCustomer?: boolean`, added when case 001's `stationList` was first authored specifically anticipating this. Case 001's `world.ts` gains one more `StationRow` (M. Ferrier's own station, `isCurrentCustomer: true`, post-fix values — `throughputRxMbps: 30`, `connectionTime: "00:38"`) alongside the existing "Lakeside Inn" row.

**`DeviceManagePane`'s backups are a new `World.deviceBackups?: { label: string; at: string }[]` field.** Read-only display only — the component doesn't need a working "restore" action, since the trainee's actual decision happens through stage 9's `action` prompt (multiple-choice), not by interacting with the dashboard mock itself.

**The account plan-upgrade detail ("plan 35/10 → later 50/10") is dropped.** Outline §9's own `World` summary frames the shaper misconfiguration as fallout from an account-level plan upgrade. Retroactively changing `customer.plan.down` would shift `LinkCapacityChart`'s "plan" reference line on stages 1/4/5 — already shipped, already played live, already calibrated (the "60-65 Mbps ceiling vs. 35 Mbps plan" read in stage 1's rubric). The shaper reconfiguration is motivated by routine maintenance instead ("cleaning up shaper profiles across the sector," conveyed via stage 6's `ticketNote`) — same pedagogical point (a config change, not hardware, caused this), without touching already-verified content.

## Risks / Trade-offs

- **[Risk] Dropping the plan-upgrade detail diverges from outline §9's literal text.** → **Mitigation**: the pedagogical point (own-your-change, what-changed-when) is unaffected by *why* the shaper was touched — only the specific triggering reason changes, and it's documented here rather than silently dropped.
- **[Risk] `DeviceOverview`'s chart doesn't literally render "gaps where NMS lost contact"** (outline §9's phrasing) — `shaperCollapse` produces a continuous line, not a gapped one. → **Mitigation**: the gap detail is conveyed through the stage's rubric/feedback text ("gaps = starved management") rather than a literal rendering gap; the component's real teaching point (RX/TX symmetry) is genuinely modeled, not just described.

## Migration Plan

Additive only: new components, new optional `World`/`WorldSeries` fields, `throughputRx1h`'s generator changes (from placeholder to real) but its schema shape doesn't — existing code reading that field is unaffected. Two new `WorldEvent`s and five new stages append to already-shipped content using ids reserved for exactly this (`s6`-`s10`, per case-engine-minimal-playable's original stage-id comment).
