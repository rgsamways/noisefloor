## Why

`docs/NOISEFLOOR-CONSOLE-HANDOFF.md` §5 calls the service layer "the single most valuable lesson in the whole thing": *a green radio panel is not the same as a working customer.* `ServiceLayerTelemetry` (DHCP lease, addressing, NAT) already exists in `packages/console-schema`, but nothing produces it — `packages/simulation-engine` only simulates `RadioLinkTelemetry` today. Without a service-layer simulation, the console's second panel has no live data to prove that lesson with.

## What Changes

Handoff §5 names five service-layer faults. They are not uniform in difficulty, and forcing all five into one pass would mean guessing at real schema/architecture gaps instead of surfacing them — the same discipline `radio-console-schema` and `simulation-engine` both followed (scope narrow, name what's deferred).

**In this change — two faults that map cleanly onto the existing `ServiceLayerTelemetry` schema, plus the discrete fault mechanism they're built on:**
- **Expired lease** — `dhcpLease.present` flips to `false`, `leaseAddress` shows a self-assigned-looking fallback address, `expectedAddress` shows what the customer should have gotten. Matches handoff §5's "self-assigned a useless address, and won't try hard again."
- **Double NAT** — both `nat.upstreamPresent` and `nat.customerSidePresent` read `true` simultaneously (a healthy link has exactly one of the two true).
- A discrete "fault mode" mechanism for service-layer faults, deliberately simpler than the radio-link engine's continuous `linkHealth`-scalar model: service-layer failures are protocol/configuration failures, not signal decay, so there's no "correlated movement" to model — a fault here means specific fields flip to specific values at/after a trigger time, not a physics-flavored ramp.

**Explicitly deferred — not attempted here, because each raises a real open question that shouldn't be answered by guessing:**
- **Customer router offline.** `ServiceLayerTelemetry` as currently modeled is the radio/ISP-side view (lease handed to the customer, management IP, gateway, WAN address, NAT state). It's not obvious that any of those fields change in a way that distinguishes "customer's router lost power" from "customer's router just hasn't renewed its lease yet." May need a new field, or may need the far-end-drop staleness pattern already built for `RadioLinkTelemetry` applied analogously here — undecided.
- **Rogue DHCP server.** The schema has no concept of "a second, unauthorized DHCP server is answering on the segment" — representing handoff §5's "works sometimes" (intermittent address conflicts) may need a new field entirely. Undecided.
- **Wrong boot order after a power cut.** Architecturally different from the other four: it's specifically about the *interaction* between the radio coming back up (`RadioLinkTelemetry.radioHealth.uptimeSeconds` resetting) and the service layer's DHCP process depending on the radio being up first. Correctly simulating it means coordinating timing across both telemetry types from one shared trigger event (the power cut) — `simulateRadioLink` and any new service-layer simulation don't currently share any state to do that. Real added complexity, not a simple preset.

## Capabilities

### New Capabilities
(none — this extends the existing `simulation-engine` capability)

### Modified Capabilities
- `simulation-engine`: adds a `simulateServiceLayer` function and a discrete fault mechanism producing `ServiceLayerTelemetry`, plus two named faults (expired lease, double NAT).

## Impact

- **Affected code**: `packages/simulation-engine` only — a new module alongside the existing radio-link simulation, consuming `@noisefloor/console-schema`'s `ServiceLayerTelemetry`. No change to `packages/console-schema` in this pass.
- **Not affected**: `simulateRadioLink`, the five existing radio-link faults, `RadioLinkTelemetry`.
- **Unlocks**: a console UI can render a live service-layer panel for the first time. The three deferred faults become their own follow-up change(s) once their open questions are actually resolved — possibly requiring a `console-schema` change first if a new field turns out to be needed.
