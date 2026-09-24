## ADDED Requirements

### Requirement: ServiceLayerTelemetry's LAN port exposes Ethernet link quality, not just up/down
`ServiceLayerTelemetry`'s `lanPort` group SHALL include `linkSpeedMbps` (negotiated Ethernet link speed), `duplex` (`"full"` or `"half"`), and `crcErrorCount` (a non-negative count of physical-layer frame errors observed on the port) alongside its existing `linkUp` field — so a degraded-but-still-connected Ethernet link is representable, not just fully up or fully down.

#### Scenario: A degraded-but-up LAN port validates
- **WHEN** a `ServiceLayerTelemetry` object sets `lanPort.linkUp` to `true`, `lanPort.linkSpeedMbps` below the gear's normal negotiated rate, and `lanPort.crcErrorCount` to a positive value
- **THEN** it SHALL be accepted as a valid `ServiceLayerTelemetry` value, distinct from a fully down LAN port

#### Scenario: A healthy LAN port has no errors and a normal negotiated speed
- **WHEN** a `ServiceLayerTelemetry` object represents a healthy, undegraded LAN port
- **THEN** `lanPort.crcErrorCount` SHALL read `0` and `lanPort.linkSpeedMbps`/`lanPort.duplex` SHALL reflect the gear's normal negotiated rate and full duplex
