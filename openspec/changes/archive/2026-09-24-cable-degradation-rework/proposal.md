## Why

The console's "Cable Degradation" scenario currently steps `chainImbalanceDb` (an RF chain-alignment field) — the exact same field and magnitude Wind Misalignment already uses. Asked directly how a T1 tech actually determines a cable is degraded, the real answer has nothing to do with RF chains at all: "the cable" in fixed-wireless is the Ethernet/PoE run from the radio down to the injector and router, and a degrading one shows up as a negotiated-speed fallback (e.g. gigabit-capable gear stuck at 100 Mbps), climbing CRC/FCS error counts, and possibly PoE-voltage-drop reboots — while RF readings (signal, SNR, modulation) stay completely clean. That last point is the actual diagnostic lesson this fault should teach ("if RF looks clean but Ethernet shows errors, the problem is below the radio, not in the air"), and today's implementation cannot teach it because it never leaves the RF domain.

## What Changes

- Add `linkSpeedMbps`, `duplex`, and `crcErrorCount` to `ServiceLayerTelemetry`'s existing `lanPort` group (the group already representing the radio's LAN-facing Ethernet port — the same physical cable this fault is about).
- Add a new service-layer fault (alongside the existing four in `packages/simulation-engine/src/service-layer.ts`) that overrides `linkSpeedMbps` down and `crcErrorCount` up, while leaving `lanPort.linkUp` true (the link stays up, just degraded) and leaving `dhcpLease`/`addressing`/`nat` and every RF field untouched.
- **BREAKING** (within this codebase, not a public API): remove the existing RF-based `cableDegradationFault` from `packages/simulation-engine/src/faults.ts` — it modeled a phenomenon that doesn't correspond to real cable degradation and was mechanically identical to `windMisalignmentFault`.
- Rebind the console scenario picker's "Cable Degradation" option from the radio-link bucket (applied to LOCAL) to the service-layer bucket, using the new fault instead of the old one.
- `ServiceLayerPanel` gains rows for the new fields, and its severity judgment gains a new "degraded" condition (LAN port up, but at reduced speed or showing errors) distinct from its existing "down" condition — so selecting this scenario visibly changes the *service* panel (correctly) while the *radio-link* panel stays green (also correctly, per the real diagnostic point above).

## Capabilities

### Modified Capabilities
- `radio-console-schema`: `ServiceLayerTelemetry`'s `lanPort` group gains new fields for negotiated link speed, duplex, and CRC error count.
- `simulation-engine`: removes the RF-based "cable degradation" fault requirement; adds a new service-layer "cable degradation" fault requirement targeting the new `lanPort` fields.
- `console-scenario-picker`: "Cable Degradation" moves from the radio-link fault list to the service-layer fault list; its old "severity badge is unaffected" requirement (which described the RF-based behavior) is removed and replaced with a requirement describing the new LAN-port-level signature.

## Impact

- `packages/console-schema/src/service-layer.ts` — `LanPortGroupSchema` gains three fields; `ServiceLayerTelemetry` consumers get new optional-to-read data (existing `linkUp`-only consumers are unaffected since it's additive).
- `packages/simulation-engine/src/faults.ts` — removes `cableDegradationFault` and its `RampPersistFault` usage for this purpose (the `rampPersist` shape itself stays, still used by Foliage Growth).
- `packages/simulation-engine/src/service-layer.ts` — adds a new fault function alongside the existing four, and default values for the three new fields in `simulateServiceLayer`.
- `packages/dashboards/src/console/ServiceLayerPanel.tsx` — new rows under "Addressing & port"; `serviceLayerSeverity` gains a new condition.
- `apps/web/src/lib/console-scenarios.ts` — "Cable Degradation" scenario definition moves from `local.scenario.faults` to `serviceLayer.scenario.faults`.
- No change to `LinkPanel`, `RadioLinkTelemetry`, or any other existing fault.
