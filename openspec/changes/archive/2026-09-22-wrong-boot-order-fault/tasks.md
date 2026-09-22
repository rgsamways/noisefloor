## 1. Fault preset

- [x] 1.1 Implement `wrongBootOrderFault(triggerAtSec)` in `packages/simulation-engine/src/service-layer.ts` with the same override as `expiredLeaseFault` (`dhcpLeasePresent: false`, self-assigned address), with a code comment documenting the radio-link `baseUptimeSeconds` pairing convention and cross-referencing `expiredLeaseFault`
- [x] 1.2 Add a matching cross-reference comment to `expiredLeaseFault` noting `wrongBootOrderFault`'s existence and shared effect
- [x] 1.3 Add a unit test exercising `wrongBootOrderFault` end-to-end (healthy → triggered → `dhcpLease.present` false, `leaseAddress` ≠ `expectedAddress`) and confirming it does not require any `RadioLinkTelemetry`/`simulateRadioLink` input

## 2. Verification

- [x] 2.1 `pnpm --filter @noisefloor/simulation-engine build`/`typecheck`/tests pass
- [x] 2.2 `pnpm lint && pnpm typecheck && pnpm test` at the repo root (confirms `console-schema`, the radio-link simulation, and the parked case-study packages are unaffected)
