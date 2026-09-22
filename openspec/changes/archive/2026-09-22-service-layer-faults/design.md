## Context

See proposal.md for motivation and the reasoning behind scoping this to two faults. This extends `packages/simulation-engine` with a second simulation surface — `ServiceLayerTelemetry` — alongside the existing radio-link one. Unlike `RadioLinkTelemetry`'s fields, which are continuous physical readings, `ServiceLayerTelemetry`'s fields (a lease present or not, which NAT layers are active, what address got assigned) are discrete/categorical — closer to configuration state than a physical measurement.

## Goals / Non-Goals

**Goals:**
- A `simulateServiceLayer(config, atSec)` function, architecturally parallel to `simulateRadioLink` (pure function of config + simulated time), so the two simulation surfaces feel consistent to a future caller even though their internal fault mechanisms differ.
- A fault mechanism proportionate to what these faults actually are: named field overrides applied from a trigger time onward, not a physics-flavored scalar. Building the `linkHealth`-style continuous model here would be modeling degradation that doesn't exist — a DHCP lease doesn't gradually degrade, it's either valid or it isn't.

**Non-Goals:**
- No changes to `ServiceLayerTelemetry` itself, or to any radio-link code.
- No customer-router-offline, rogue-DHCP, or boot-order fault — all three explicitly deferred per proposal.md, each for a different, real reason (schema gap, schema gap, cross-telemetry timing).
- No cross-telemetry coordination between `simulateRadioLink` and `simulateServiceLayer` in this change — they remain fully independent functions. (Boot order is exactly the fault that would need this; it's deferred specifically because this change doesn't build that coordination.)

## Decisions

**`ServiceLayerFault = { triggerAtSec: number; overrides: Partial<ServiceLayerOverrides> }`**, where `ServiceLayerOverrides` names each simulatable field directly (`dhcpLeasePresent`, `leaseAddress`, `expectedAddress`, `natUpstreamPresent`, `natCustomerSidePresent`). A fault is "from `triggerAtSec` onward, these fields read as given" rather than a shape with ramp/hold/recover math — there's no gradual phase to a lease expiring or a second NAT layer appearing. Multiple faults active at once apply in trigger order, with a later-triggered fault's overrides taking precedence on any field both touch (last-write-wins, same as the radio-link engine's additive-delta faults but simpler since there's no numeric combination to do).

**Healthy-baseline DHCP lease renews periodically rather than staying static, on a confirmed 24-hour (86400s) lease duration** — Robin: "i believe most are 24hr." `remainingSeconds` counts down from `86400` and resets each time it would hit zero (`remainingSeconds = 86400 - (atSec % 86400)`, `issuedAt` recomputed to match) — a believable healthy lease renews, it doesn't just sit at one number forever. This is the only place this change borrows a time-based pattern from the radio-link engine, and only for the healthy path; the two fault presets are simple overrides on top of it, not new time-signature shapes.

**Healthy-baseline NAT defaults to `customerSidePresent: true`, `upstreamPresent: false` — now a field-confirmed common case, not an arbitrary pick.** Robin: "most of our customers have radios set to router. i'm guessing that gives their router job of NATing?" — confirming that for most NRN customers, the radio itself (in router mode) is the device doing customer-side NAT. Worth noting for later: "customer router" in the schema field name and handoff §5's own wording really means "whichever device is in router mode and doing NAT" — that's very often the radio itself, not a separate physical box behind it. No schema rename in this change; just worth remembering when this reads back later.

**Expired lease's self-assigned address uses the APIPA-style convention (169.254.x.x) — a documented judgment call, not a verified real-device behavior.** Robin didn't know what NRN's actual customer-premises gear (Sagemcom, TP-Link HX220 per handoff §8) does when a lease can't be renewed, and asked what's common. Chosen here because it matches the handoff doc's own phrasing ("self-assigned a useless address") and gives trainees an unambiguous, learnable signal — "169.254.x.x means self-assigned, not a real lease" is a clean thing to teach regardless of whether every specific CPE model does exactly that. Real embedded router firmware might instead retain its last-known address or show `0.0.0.0` — this convention should be revisited if it turns out to mislead rather than teach.

**`expiredLeaseFault(triggerAtSec)` and `doubleNatFault(triggerAtSec)` are the two named presets**, each a direct parameterization of the override mechanism above — no new types needed beyond `ServiceLayerFault` itself.

## Risks / Trade-offs

- **[Risk] Splitting radio-link and service-layer simulation into two unrelated functions makes the deferred "wrong boot order" fault harder to build later** — it will need to reach into both. → **Mitigation**: accepted deliberately; building shared cross-telemetry state now, for a fault this change doesn't implement, would be speculative design. The boot-order follow-up change is the right place to decide how (or whether) to unify them.
- **[Risk] The expired-lease self-assigned address (169.254.x.x) is a teaching-convenience guess, not verified against NRN's actual customer-premises gear.** → **Mitigation**: flagged explicitly above rather than asserted as real-device behavior; same posture as the cable-degradation chain-imbalance guess in `radio-fault-library`. Revisit if it turns out to teach the wrong thing once real gear or a UI is checked against it.
