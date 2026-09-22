## MODIFIED Requirements

### Requirement: ServiceLayerTelemetry is a distinct top-level shape
`ServiceLayerTelemetry` SHALL be a separate type from `RadioLinkTelemetry`, covering DHCP lease state, addressing, NAT, and LAN-port physical link state per `docs/NOISEFLOOR-CONSOLE-HANDOFF.md` §5. It SHALL NOT be nested inside or merged with `RadioLinkTelemetry`.

#### Scenario: A healthy service-layer object validates independently of any radio-link data
- **WHEN** a `ServiceLayerTelemetry` object is validated on its own, with no `RadioLinkTelemetry` present
- **THEN** it SHALL be accepted

## ADDED Requirements

### Requirement: ServiceLayerTelemetry exposes LAN-port physical link state
`ServiceLayerTelemetry` SHALL include a `lanPort` group, separate from `addressing`, carrying the radio's LAN-facing Ethernet link/carrier state. This group SHALL represent physical-layer connectivity (is something plugged in and powered on the other end), not IP-layer configuration.

#### Scenario: A ServiceLayerTelemetry object without an active LAN link still validates
- **WHEN** a `ServiceLayerTelemetry` object sets its `lanPort` link state to indicate no active link
- **THEN** it SHALL be accepted, independent of the validity of `dhcpLease`, `addressing`, or `nat`

#### Scenario: lanPort is not part of addressing
- **WHEN** a `ServiceLayerTelemetry` object is inspected
- **THEN** its LAN-port link state SHALL be accessible under `lanPort`, not as a field within `addressing`
