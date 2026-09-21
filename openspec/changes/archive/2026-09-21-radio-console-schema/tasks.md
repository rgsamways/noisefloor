## 1. Package setup

- [x] 1.1 Scaffold `packages/console-schema` (package.json, tsconfig, mirroring `packages/shared`'s build/lint/test setup)
- [x] 1.2 Add to `pnpm-workspace.yaml` if not covered by the existing `packages/*` glob

## 2. Radio-link schema

- [x] 2.1 `Reading<T>` generic wrapper type (`{value: T; asOf: string}`)
- [x] 2.2 `link` group: signal (dBm), noiseFloor (dBm), snr (dB), linkQuality (%), modulation (index), frequencyMhz, channelWidthMhz, linkState (enum: connected/associating/down), chainImbalanceDb, txPowerDbm — each wrapped in `Reading<T>`
- [x] 2.3 `throughput` group: txRateMbps, rxRateMbps, airtimePct, channelUtilizationPct, clientCount
- [x] 2.4 `farEnd` group: distanceKm, latencyMs, jitterMs, packetLossPct, errorsRetries
- [x] 2.5 `radioHealth` group: cpuPct, ramPct, temperatureC, uptime (duration)
- [x] 2.6 `timeEvidence` group (its own top-level group, not nested in `radioHealth`): lastReboot, lastLogEntry, lastSuccessfulPoll
- [x] 2.7 `vendorExtras: Record<string, unknown>` escape hatch
- [x] 2.8 Assemble `RadioLinkTelemetry` from the above groups; export from package index

## 3. Service-layer schema

- [x] 3.1 `ServiceLayerTelemetry`: DHCP lease (present/absent, issuedAt, remaining, leaseAddress vs. expected), addressing (management IP, gateway, WAN address), NAT (upstream present?, customer-side present?)
- [x] 3.2 Export from package index

## 4. Link profile

- [x] 4.1 `LinkProfile`: distanceKm, band, gearClass — shape only, no normalness-judging logic
- [x] 4.2 Export from package index

## 5. Verification

- [x] 5.1 Unit tests: every field group validates a representative healthy-baseline object; `Reading<T>` rejects a value with a malformed `asOf`
- [x] 5.2 `pnpm --filter @noisefloor/console-schema typecheck`/`build`/`test`
- [x] 5.3 `pnpm lint && pnpm typecheck && pnpm test` at the repo root (confirms nothing in the parked case-study packages was touched)
