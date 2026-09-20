## Why

`PROJECT-PLAN.md` §4 row 3 ("Full case 001 + `radio`/`nms` families") is the next phase after the minimal-playable foliage arc (stages 1/4/5) shipped. Rather than building both dashboard families and all six remaining stages (2, 3, 6-10) plus optional branches in one change, this narrows to the next contiguous chunk of the case: stages 2 and 3, which sit *between* the already-played stage 1 and stage 4 (outline §9's stage order is 1→2→3→4→5→...), and only need the `radio/*` family — `nms/*` and stages 6-10 (the separate shaper-collapse subplot) stay deferred, matching how the case-engine-minimal-playable change itself was narrowed.

## What Changes

- Add four `radio/*` components to `packages/dashboards` per `NOISEFLOOR-OUTLINE.md` §7: `LinkHeader`, `SignalPanel`, `RateBar`, `DeviceDetails`. One new shared primitive, `SegmentBar` (a discrete N-of-M segment bar, for `RateBar`'s 1X-8X modulation display).
- **Schema addition**: `Device` (`packages/shared/src/schemas/world.ts`) gains optional `mac`, `txPowerDbm`, and `lanSpeedMbps` fields — cosmetic display fields the outline's `LinkHeader`/`DeviceDetails` descriptions call for, none used by any rubric or validator rule. Optional so existing `World` content (gallery fixtures, case 001's already-authored `world.ts`) isn't broken.
- Insert stages 2 ("Why is the ceiling where it is?") and 3 ("Should this be a dispatch?") into case 001, between the existing stages 1 and 4. Both use the `nextCheck`/`action` prompt kinds and `options`-kind rubrics already in the schema — no prompt/rubric schema changes needed.
- Extend `apps/web`'s `CasePlayer`'s evidence renderer to handle the four new `radio/*` views (currently only `crm/LinkCapacityChart` is recognized; everything else falls back to "Unsupported evidence view").
- Add gallery entries (`/dev/gallery`) and a Playwright visual snapshot for each new component, matching `LinkCapacityChart`'s existing pattern.
- No `apps/api` route changes — stage gating and commit scoring in `routes/cases.ts`/`routes/attempts.ts` already operate generically over `case.stages`, so inserting two more stages into `packages/cases`' content is transparent to the API.

## Capabilities

### New Capabilities
- `radio-dashboard`: the four `radio/*` components and the `SegmentBar` primitive.

### Modified Capabilities
- `case-content-schema`: `Device` gains optional `mac`/`txPowerDbm`/`lanSpeedMbps` fields.

## Impact

- **Affected code**: `packages/dashboards` (new components + primitive), `packages/shared` (`Device` schema), `packages/cases` (case 001 gains stages 2/3, `World` gains the new optional device fields), `apps/web` (evidence renderer, gallery entries, visual snapshots).
- **Scope reductions, explicit**: `nms/*` family and stages 6-10 (the shaper-collapse subplot, a structurally separate incident from the foliage arc) are not in this change. Optional branches A/B (outline §9) are not in this change. The debrief is not rewritten yet — it still reads as the foliage-arc-only story; rewriting it to cover the full case waits until the case is actually complete.
- **No breaking change**: `Device`'s new fields are optional; existing `World` content (gallery fixtures) validates unchanged. Stage insertion uses `s2`/`s3` ids that were reserved for exactly this since case-engine-minimal-playable (see that change's `stages.ts` comment) — no renumbering of `s1`/`s4`/`s5`, so no existing `stage_commits` row or in-progress attempt is invalidated.
