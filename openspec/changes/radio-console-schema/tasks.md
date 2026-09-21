## 1. Package setup

- [ ] 1.1 Scaffold `packages/console-schema` (package.json, tsconfig, mirroring `packages/shared`'s build/lint/test setup)
- [ ] 1.2 Add to `pnpm-workspace.yaml` if not covered by the existing `packages/*` glob

## 2. Radio-link schema

- [ ] 2.1 `Reading<T>` generic wrapper type (`{value: T; asOf: string}`)
- [ ] 2.2 `link` group: signal (dBm), noiseFloor (dBm), snr (dB), linkQuality (%), modulation (index), frequencyMhz, channelWidthMhz, linkState (enum: connected/associating/down), chainImbalanceDb, txPowerDbm — each wrapped in `Reading<T>`
- [ ] 2.3 `throughput` group: txRateMbps, rxRateMbps, airtimePct, channelUtilizationPct, clientCount
- [ ] 2.4 `farEnd` group: distanceKm, latencyMs, jitterMs, packetLossPct, errorsRetries
- [ ] 2.5 `radioHealth` group: cpuPct, ramPct, temperatureC, uptime (duration)
- [ ] 2.6 `timeEvidence` group (its own top-level group, not nested in `radioHealth`): lastReboot, lastLogEntry, lastSuccessfulPoll
- [ ] 2.7 `vendorExtras: Record<string, unknown>` escape hatch
- [ ] 2.8 Assemble `RadioLinkTelemetry` from the above groups; export from package index

## 3. Service-layer schema

- [ ] 3.1 `ServiceLayerTelemetry`: DHCP lease (present/absent, issuedAt, remaining, leaseAddress vs. expected), addressing (management IP, gateway, WAN address), NAT (upstream present?, customer-side present?)
- [ ] 3.2 Export from package index

## 4. Link profile

- [ ] 4.1 `LinkProfile`: distanceKm, band, gearClass — shape only, no normalness-judging logic
- [ ] 4.2 Export from package index

## 5. Verification

- [ ] 5.1 Unit tests: every field group validates a representative healthy-baseline object; `Reading<T>` rejects a value with a malformed `asOf`
- [ ] 5.2 `pnpm --filter @noisefloor/console-schema typecheck`/`build`/`test`
- [ ] 5.3 `pnpm lint && pnpm typecheck && pnpm test` at the repo root (confirms nothing in the parked case-study packages was touched)
