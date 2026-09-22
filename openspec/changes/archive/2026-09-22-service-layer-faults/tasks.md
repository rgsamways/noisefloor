## 1. Healthy-baseline service-layer simulation

- [x] 1.1 Implement the healthy-baseline field values for `addressing` (static management IP/gateway/WAN address) and `nat` (`customerSidePresent: true`, `upstreamPresent: false`)
- [x] 1.2 Implement the periodically-renewing `dhcpLease` baseline (`remainingSeconds` counting down from a 24-hour/86400s lease duration and resetting on renewal, `issuedAt` consistent with the current renewal period, `leaseAddress` equal to `expectedAddress`) and verify a unit test shows `remainingSeconds` decreasing then resetting across a renewal boundary
- [x] 1.3 Implement `simulateServiceLayer(config, atSec): ServiceLayerTelemetry` assembling the above into a full snapshot and verify it produces a fully valid `ServiceLayerTelemetry` per the `console-schema` Zod schema

## 2. Discrete fault mechanism

- [x] 2.1 Define `ServiceLayerFault` (`triggerAtSec`, `overrides` covering `dhcpLeasePresent`/`leaseAddress`/`expectedAddress`/`natUpstreamPresent`/`natCustomerSidePresent`) and verify a unit test shows a fault's overrides are absent before `triggerAtSec` and present at/after it
- [x] 2.2 Support multiple simultaneously-active faults with last-triggered-wins precedence on overlapping fields, and verify a unit test with two faults touching the same field shows the later-triggered one winning
- [x] 2.3 Wire fault application into `simulateServiceLayer`

## 3. Named faults

- [x] 3.1 Implement `expiredLeaseFault(triggerAtSec)`: overrides `dhcpLeasePresent` to `false` and `leaseAddress` to a self-assigned-looking value distinct from `expectedAddress`, and verify a unit test exercises it end-to-end (healthy → triggered → `present` false, `leaseAddress` ≠ `expectedAddress`)
- [x] 3.2 Implement `doubleNatFault(triggerAtSec)`: overrides both `natUpstreamPresent` and `natCustomerSidePresent` to `true`, and verify a unit test exercises it end-to-end (healthy → triggered → both true simultaneously)

## 4. Verification

- [x] 4.1 Run the full `packages/simulation-engine` unit test suite (including the new service-layer tests) and confirm it passes
- [x] 4.2 `pnpm --filter @noisefloor/simulation-engine typecheck`/`build`
- [x] 4.3 `pnpm lint && pnpm typecheck && pnpm test` at the repo root (confirms `console-schema`, the existing radio-link simulation, and the parked case-study packages are unaffected)
