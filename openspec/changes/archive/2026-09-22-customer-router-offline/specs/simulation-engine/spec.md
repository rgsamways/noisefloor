## ADDED Requirements

### Requirement: Customer router offline drops LAN-port link state
The engine SHALL support a "customer router offline" fault that, once triggered, sets `ServiceLayerTelemetry`'s LAN-port link state to indicate no active link, while leaving `dhcpLease`, `addressing`, and `nat` unaffected by this fault specifically.

#### Scenario: Customer router offline drops the LAN link and nothing else
- **WHEN** a "customer router offline" fault has triggered by the time of a snapshot, with no other fault active
- **THEN** the LAN-port link state SHALL indicate no active link, and `dhcpLease`, `addressing`, and `nat` SHALL match their healthy-baseline values
