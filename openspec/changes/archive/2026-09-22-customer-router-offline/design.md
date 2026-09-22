## Context

See proposal.md for motivation. This touches two already-implemented packages: `packages/console-schema` (`ServiceLayerTelemetry`, defined in `service-layer.ts`) and `packages/simulation-engine` (`simulateServiceLayer`'s discrete override mechanism, also in a `service-layer.ts`). Both are small, additive changes — no existing field, group, or fault behavior changes.

## Goals / Non-Goals

**Goals:**
- Represent LAN-port physical link state as its own group, per Robin's confirmation that it's physical-layer, not IP-layer configuration.
- Resolve `customerRouterOfflineFault` using the exact same discrete-override mechanism `expiredLeaseFault`/`doubleNatFault` already use — no new fault mechanism needed.

**Non-Goals:**
- No attempt to model *why* the link dropped (cable cut vs. router powered off vs. port failure) — the schema only represents the observable fact (link up or not), matching how `RadioLinkTelemetry.link.linkState` already just reports connected/associating/down without modeling cause.
- No change to `dhcpLease`, `addressing`, or `nat`.
- No cross-telemetry timing (this remains a `ServiceLayerTelemetry`-only fault, unlike the still-deferred "wrong boot order").
- No log-simulation content for this fault — that's out of scope for both schema and simulation-engine changes.

## Decisions

**New group: `lanPort: { linkUp: Reading<boolean> }`.** `linkUp: true` is the healthy baseline (a real downstream router/device is plugged in and drawing an active Ethernet link); `linkUp: false` represents "no active link" — the customer router offline fault's entire effect. Kept to a single boolean rather than modeling link speed/duplex/etc., since nothing in handoff §5 or this fault needs more than "is there a link."

**Sits alongside `dhcpLease`/`addressing`/`nat` as a fourth top-level group in `ServiceLayerTelemetry`**, not nested under `addressing` — confirmed with Robin as physical-layer state distinct from IP-layer config.

**Healthy-baseline default in `simulateServiceLayer`: `linkUp: true`**, consistent with every other healthy-baseline default in both service-layer and radio-link simulation (nothing is "on" a bad state unless a fault says so).

**`ServiceLayerOverrides` (packages/simulation-engine/src/service-layer.ts) gains a `lanPortLinkUp: boolean` field**, following the exact naming/shape convention of the existing override fields (`dhcpLeasePresent`, `natUpstreamPresent`, etc.) — no new override mechanism, just one more overridable field.

**`customerRouterOfflineFault(triggerAtSec)` sets only `lanPortLinkUp: false`**, touching no other override field — this is what the spec's "and nothing else" scenario checks, since a real failing/wet cable (already covered by `cableDegradationFault`) and a customer's router losing power are different faults that happen to both plausibly involve a cable, but shouldn't be conflated in the simulation.

## Risks / Trade-offs

- **[Risk] A single `linkUp` boolean can't represent a flapping/intermittent link** (a marginal cable that drops and reconnects), which is a real, different failure mode from a clean power-off. → **Mitigation**: out of scope for this change; `customerRouterOfflineFault`'s discrete step-to-false-and-stay-false behavior is the right shape for "someone unplugged/powered off the router," not for a flaky connection — a flapping variant would be a natural, separate follow-up fault, not a reason to complicate this one.
- **[Risk] This is still schema evolution on an already-archived capability (`radio-console-schema`) — cheap now, but worth remembering it happened** if a real vendor driver in phase two turns out not to expose LAN-port link state as cleanly as assumed. → **Mitigation**: same posture as every other schema-accuracy risk in this project; flagged, not asserted as guaranteed to survive contact with a real vendor API.
