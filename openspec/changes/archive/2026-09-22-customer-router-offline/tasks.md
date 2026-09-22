## 1. Schema addition (packages/console-schema)

- [x] 1.1 Add `LanPortGroupSchema` (`linkUp: readingSchema(z.boolean())`) to `service-layer.ts`
- [x] 1.2 Add `lanPort: LanPortGroupSchema` to `ServiceLayerTelemetrySchema` and export `LanPortGroup`/its type
- [x] 1.3 Update the module-level doc comment referencing "DHCP lease, addressing, and NAT" to include LAN-port link state
- [x] 1.4 Add a unit test confirming a `ServiceLayerTelemetry` object with `lanPort.linkUp` set to `false` still validates independently of `dhcpLease`/`addressing`/`nat` validity
- [x] 1.5 `pnpm --filter @noisefloor/console-schema build`/`typecheck`/tests pass

## 2. Simulation fault (packages/simulation-engine)

- [x] 2.1 Add `lanPortLinkUp: boolean` to `ServiceLayerOverrides`
- [x] 2.2 Add `linkUp: true` as the healthy-baseline default in `simulateServiceLayer`, and wire the new `lanPort` group into its returned snapshot
- [x] 2.3 Implement `customerRouterOfflineFault(triggerAtSec)` overriding only `lanPortLinkUp: false`, and verify a unit test exercises it end-to-end (healthy → triggered → `lanPort.linkUp` false, `dhcpLease`/`addressing`/`nat` unchanged from healthy baseline)
- [x] 2.4 `pnpm --filter @noisefloor/simulation-engine build`/`typecheck`/tests pass

## 3. Verification

- [x] 3.1 Run the full `packages/console-schema` and `packages/simulation-engine` unit test suites and confirm they pass
- [x] 3.2 `pnpm lint && pnpm typecheck && pnpm test` at the repo root (confirms the radio-link schema/simulation and the parked case-study packages are unaffected)
