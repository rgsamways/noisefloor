## REMOVED Requirements

### Requirement: Cable degradation applies a gradual, non-recovering ramp
**Reason**: This requirement described cable degradation as an RF fault stepping `chainImbalanceDb` — mechanically identical to Wind Misalignment. Asked directly, a real T1 tech's answer confirmed this doesn't correspond to how a degrading cable actually presents: in fixed-wireless, "the cable" is the Ethernet/PoE run below the radio, not an RF path, and its diagnostic signature (negotiated-speed fallback, climbing CRC errors) never touches RF fields at all — the RF side is supposed to stay clean, which is the whole diagnostic point real techs rely on.
**Migration**: See the new "Cable degradation degrades the LAN-port Ethernet link, not RF fields" requirement below. Any scenario previously binding `cableDegradationFault` to a `SimulationConfig`'s radio-link `scenario.faults` must instead bind the new same-named fault to a `ServiceLayerConfig`'s `scenario.faults`.

## ADDED Requirements

### Requirement: Cable degradation degrades the LAN-port Ethernet link, not RF fields
The engine SHALL support a "cable degradation" fault that, once triggered, reduces `lanPort.linkSpeedMbps` below its healthy-baseline value and raises `lanPort.crcErrorCount` above zero, while leaving `lanPort.linkUp` `true` and leaving `dhcpLease`, `addressing`, `nat`, and every `RadioLinkTelemetry` field at their healthy-baseline values.

#### Scenario: Cable degradation shows a degraded-but-connected LAN port
- **WHEN** a "cable degradation" fault has triggered by the time of a `ServiceLayerTelemetry` snapshot
- **THEN** `lanPort.linkUp` SHALL read `true`, `lanPort.linkSpeedMbps` SHALL be below its healthy-baseline value, and `lanPort.crcErrorCount` SHALL be greater than `0`

#### Scenario: Cable degradation does not require or affect any RadioLinkTelemetry value
- **WHEN** a "cable degradation" fault is defined and applied to produce a `ServiceLayerTelemetry` snapshot
- **THEN** the engine SHALL NOT require any `RadioLinkTelemetry` value as an input to compute the result, and a `RadioLinkTelemetry` snapshot for the same link taken at the same time SHALL be unaffected by whether this fault is active
