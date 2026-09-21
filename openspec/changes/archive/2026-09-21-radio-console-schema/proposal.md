## Why

`docs/NOISEFLOOR-CONSOLE-HANDOFF.md` pivots noisefloor's phase one from case-based training to a single vendor-neutral radio console (§2). The handoff doc's own closing argument (§10): "the schema works. If 21 fields plus a service layer render a believable link in simulation, they'll render a real one in phase two." Nothing else in the console — the simulation engine, the UI, phase-two vendor drivers — can be built without first fixing that schema. This change scopes the schema alone, deliberately, so it can be reviewed on its own before the simulation engine or UI are designed against it.

## What Changes

- Add a normalized `RadioLinkTelemetry` schema (Zod, in a new package) covering the handoff doc's four radio-link field groups (§4: link, throughput/capacity, far end, radio health) plus the time-evidence group (§4a: last reboot, last log entry, last successful poll) and a `vendorExtras` bucket for anything vendor-specific that doesn't map cleanly.
- Add a `ServiceLayerTelemetry` schema (§5: DHCP lease, addressing, NAT) — a second, separate panel's worth of data, not folded into the radio schema.
- Add a `Staleness` wrapper type: every field in both schemas carries an age/last-updated timestamp, per §4b — "a naive panel keeps showing [stale] values and the screen looks healthy while the link is dead."
- Add a `LinkProfile` type (§6.3: distance, band, gear class) that the schema's consumers use to judge whether a given reading is normal for *this* link, not a global constant.
- No simulation engine, no UI, no vendor driver in this change — those are explicitly sequenced after this schema is settled (see design.md's Non-Goals).

## Capabilities

### New Capabilities
- `radio-console-schema`: the normalized telemetry schema (radio link + service layer + staleness + link profile) that every later console capability (simulation engine, console UI, phase-two vendor drivers) reads and writes.

### Modified Capabilities
(none — this is new, standalone scope; it does not touch the parked case-study schemas in `packages/shared/src/schemas`)

## Impact

- **Affected code**: a new package (name TBD in design.md) holding the schema; no existing package is modified.
- **Not affected**: `packages/shared` (parked case-study `World`/`Case` schemas untouched), `packages/cases`, `packages/dashboards`'s `crm`/`nms`/`radio` families, `apps/api`'s case routes, `apps/web`'s case-player pages.
- **Unlocks**: a follow-up change can build the simulation engine against this schema; another can build the console UI; another (phase two) can build a real vendor driver returning this same shape.
