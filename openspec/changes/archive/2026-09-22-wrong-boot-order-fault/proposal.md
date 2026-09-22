## Why

`service-layer-faults` (archived 2026-09-22) deferred "wrong boot order after a power cut" (`docs/NOISEFLOOR-CONSOLE-HANDOFF.md` §5) because it looked like it needed `simulateRadioLink` and `simulateServiceLayer` to share timing off one event — neither shares any state today. Working through the actual design with Robin dissolved that blocker: this engine has never modeled repair/remediation actions for any fault (a Non-Goal since the original `simulation-engine` change), so there's no boot *race* to simulate at runtime — only two panels showing correlated evidence that one happened. This is the last of the three faults `service-layer-faults` deferred, and closes out handoff §5's full fault list.

## What Changes

- Add `wrongBootOrderFault(triggerAtSec)` to `packages/simulation-engine`'s service-layer fault presets, alongside `expiredLeaseFault`/`doubleNatFault`/`customerRouterOfflineFault`. Its override behavior is identical to `expiredLeaseFault` (`dhcpLeasePresent: false`, self-assigned address) — kept as its own named function, not a bare alias, so it's semantically distinct for scenario authoring and can diverge later if repair-action modeling is ever added.
- Document a scenario-pairing convention (design.md and a code comment, not new code): to represent the *full* fault, a scenario author also configures the paired `simulateRadioLink` call's existing `baseUptimeSeconds` option to a small value matching this fault's trigger time — producing the "radio recently rebooted, service layer never recovered" correlation that's the actual diagnostic signature, per handoff's "radio green, customer down."
- No new shared timing/event type. No change to `simulateRadioLink`, `RadioLinkTelemetry`, or `ServiceLayerTelemetry`. No "cause" field — the console's thesis is reading correlated instruments, not being told the answer.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `simulation-engine`: adds `wrongBootOrderFault` to the service-layer fault mechanism.

## Impact

- **Affected code**: `packages/simulation-engine/src/service-layer.ts` only (one new preset function).
- **Not affected**: `simulateRadioLink`, `RadioLinkTelemetry`, `ServiceLayerTelemetry`, every other existing fault.
- **Unlocks**: all five handoff §5 service-layer faults are now either implemented (expired lease, double NAT, customer router offline, wrong boot order) or reframed as belonging to a different, not-yet-scoped piece of work (rogue DHCP → log simulation, handoff §7).
