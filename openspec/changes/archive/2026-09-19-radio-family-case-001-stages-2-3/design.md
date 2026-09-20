## Context

See `proposal.md`. Case 001 currently plays stages 1 → 4 → 5 (case-engine-minimal-playable). This change inserts stages 2 and 3 back into their real narrative position (1 → 2 → 3 → 4 → 5), which is why it needs the `radio/*` family: outline §9 reveals `radio/LinkHeader`, `SignalPanel`, `RateBar` at stage 2 and `radio/DeviceDetails` at stage 3.

## Goals / Non-Goals

**Goals:**
- Four `radio/*` components, built against the `World` fields case 001's `world.ts` already has (link/cpe/ap were fully populated when that file was authored, anticipating exactly this).
- Case 001 playable end-to-end as 1 → 2 → 3 → 4 → 5, no gaps.
- Reuse the validator's own CINR→rate expectation table for `RateBar`'s "expected vs actual" rather than re-deriving it, so there's one source of truth for what a given CINR should support.

**Non-Goals:**
- `nms/*` family and stages 6-10 — a structurally separate incident (the shaper-collapse subplot) needing `WorldEvent`s the event-coherence validator rule doesn't have modeled effects for yet, same reasoning case-engine-minimal-playable's `world.ts` comment already gave for leaving `events: []`.
- Optional branches A/B (outline §9) — deeper-dive content, not required for the main path to be complete.
- Rewriting the debrief to cover the full case — it stays scoped to the foliage arc until the case actually is the full case.
- `RfEnvironmentBar` and `LinkChart` (outline §7's other two `radio/*` components) — not revealed by any stage 1-5, so not built now. Same reasoning as not building the whole `nms/*` family up front: build what a stage actually needs, not the full outline inventory speculatively.

## Decisions

**`RateBar`'s "expected" rate comes from a new exported helper, not a re-derivation.** Add `expectedRateForCinr(cinrDb: number): 1|2|...|8` to `packages/shared/src/validator/constants.ts`, computed from the existing `MIN_CINR_DB_FOR_RATE` table (the highest rate whose minimum is `<= cinrDb`). Exported from `packages/shared`'s index alongside the validator. Alternative considered: hardcode a second copy of the CINR thresholds in `packages/dashboards` — rejected, since a component and the validator disagreeing about what a given CINR "should" support is exactly the kind of drift `world-validator` exists to prevent, and it'd be silent (no test would catch two independently-hardcoded tables diverging).

**`Device` gains three optional cosmetic fields**: `mac`, `txPowerDbm`, `lanSpeedMbps`. All optional (existing `World` content — gallery fixtures, case 001 — validates unchanged without them; case 001's `world.ts` gets them added as part of this change's content work). None affect any validator rule or rubric — they exist because outline §7 explicitly lists them as part of `LinkHeader`/`DeviceDetails`'s visual inventory, and a support tech's real dashboard shows them.

**Cable-SNR's "red" threshold is a component-local constant, not a validator constant.** `DeviceDetails` needs a number to decide when to render `cableSnrDb` in red (per outline §9's "cable SNR +27 dB (red)" and the `cable-snr-threshold` gotcha). This isn't a *consistency* rule (a cable SNR of 27 isn't internally contradictory with anything else in the World the way `world-validator`'s rules check for) — it's a vendor UI threshold, so it lives as a documented, explicitly-labeled-as-interpolated constant inside `DeviceDetails.tsx` itself (`const CABLE_SNR_RED_BELOW_DB = 30`), not in `validator/constants.ts`.

**`SegmentBar` primitive**: `{ filledCount: number, totalCount: number, expectedCount?: number }` — renders `totalCount` discrete segments, fills the first `filledCount`, and marks `expectedCount` with a distinct outline/tick if given and different from `filledCount`. Built for `RateBar`'s 1X-8X display; kept to exactly this shape per `StackedBars`'/`LineTrace`'s own precedent ("kept narrow to exactly what's needed, broaden only once a second consumer shows what a shared shape should look like").

**`LinkHeader` shows two device cards (CPE as "local", AP as "remote"), matching `link.signalLocalDbm`/`signalRemoteDbm`'s existing local/remote convention.** Each card: model, synthetic `mac`, `txPowerDbm`, and the device's own `uptimeHours`/mode. Link-level stats (`distanceM`, `linkPotentialPct`, `airtimeTxPct`/`airtimeRxPct`, `capacityDownMbps`/`capacityUpMbps`) render once, shared between both cards, not duplicated per side.

**`SignalPanel` shows both sides' signal/chains/noise floor, plus the computed chain delta** (`max(chains) - min(chains)`, per the `chain-imbalance` gotcha's ">3 dB means off-axis or partial obstruction" framing) rather than requiring the viewer to subtract themselves.

**Stage 2 and 3 rubrics use the existing `options` rubric kind** (`nextCheck`/`action` prompts don't have a free-text form, unlike `hypothesis` — no `hybrid` needed here).

**`CasePlayer`'s `EvidenceView` dispatch grows a `family === "radio"` branch** with one case per `view` (`LinkHeader`/`SignalPanel`/`RateBar`/`DeviceDetails`), passing `world` straight through — same pattern the existing `crm`/`LinkCapacityChart` branch already uses.

## Risks / Trade-offs

- **[Risk] Adding fields to `Device` touches every existing `World` fixture's *type*, even though no value changes.** → **Mitigation**: fields are optional; `pnpm typecheck`/`pnpm test` across the workspace after the schema change is the actual verification that nothing broke, not a manual audit.
- **[Risk] `expectedRateForCinr` being derived from `MIN_CINR_DB_FOR_RATE` means a future confirmed-number change to that table silently changes what `RateBar` displays as "expected."** → **Mitigation**: accepted — this is the intended behavior (one source of truth), called out here so it isn't mistaken for a bug later.

## Migration Plan

Additive only: new components, new optional schema fields, two new stages inserted using ids (`s2`, `s3`) reserved for exactly this since case-engine-minimal-playable. No existing `attempts`/`stage_commits` rows reference stage ids that move or change meaning.
