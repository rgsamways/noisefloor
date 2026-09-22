## Why

`service-layer-faults` (implemented, archived 2026-09-22) deliberately deferred "customer router offline" (`docs/NOISEFLOOR-CONSOLE-HANDOFF.md` §5) because none of `ServiceLayerTelemetry`'s existing fields (`dhcpLease`, `addressing`, `nat`) would actually change if a genuinely separate downstream router lost power — a stale lease alone doesn't distinguish "customer's box is off" from "hasn't renewed yet." That's now resolved through discussion with Robin: the radio's own LAN-facing Ethernet link/carrier state is a real, nearly-universal signal that would reflect exactly this fault ("i suppose it would if cables/ports are disconnected/compromised"), and it belongs in its own physical-layer group, not folded into `addressing`'s IP-layer configuration.

## What Changes

- **`radio-console-schema`**: add a new `lanPort` group to `ServiceLayerTelemetry`, alongside the existing `dhcpLease`/`addressing`/`nat` groups, carrying LAN-facing Ethernet link/carrier state.
- **`simulation-engine`**: add a `customerRouterOfflineFault` to the existing discrete service-layer fault mechanism, flipping the new field to "no link" from a trigger time onward — the same pattern as `expiredLeaseFault`/`doubleNatFault`.
- No change to `dhcpLease`, `addressing`, or `nat` themselves, and no change to the radio-link schema or simulation.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `radio-console-schema`: `ServiceLayerTelemetry` gains a `lanPort` group for physical-layer link state.
- `simulation-engine`: adds a `customerRouterOfflineFault` to the service-layer fault mechanism.

## Impact

- **Affected code**: `packages/console-schema/src/service-layer.ts` (new group), `packages/simulation-engine/src/service-layer.ts` (new fault preset).
- **Not affected**: `RadioLinkTelemetry`, `LinkProfile`, the radio-link fault library, `dhcpLease`/`addressing`/`nat`'s existing shapes.
- **Unlocks**: one of the three faults deferred from `service-layer-faults` is resolved. Rogue DHCP is expected to be reframed as log-simulation work (handoff §7, not yet scoped) rather than a schema gap. Wrong boot order remains the one fault still needing new cross-telemetry architecture.
