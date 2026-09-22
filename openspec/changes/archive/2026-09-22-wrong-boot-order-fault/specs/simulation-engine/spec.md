## ADDED Requirements

### Requirement: Wrong boot order produces the same broken-lease state as an expired lease
The engine SHALL support a "wrong boot order" fault that, once triggered, produces the same `ServiceLayerTelemetry` effect as the "expired lease" fault (`dhcpLease.present` false, a self-assigned-looking `leaseAddress` distinct from `expectedAddress`), without requiring any timing coordination with `RadioLinkTelemetry` simulation.

#### Scenario: Wrong boot order shows the same broken lease state as expired lease
- **WHEN** a "wrong boot order" fault has triggered by the time of a snapshot
- **THEN** `dhcpLease.present` SHALL read `false`, and `leaseAddress` SHALL differ from `expectedAddress`, matching the "expired lease" fault's effect

#### Scenario: Wrong boot order does not require any RadioLinkTelemetry input
- **WHEN** a "wrong boot order" fault is defined and applied to produce a `ServiceLayerTelemetry` snapshot
- **THEN** the engine SHALL NOT require any `RadioLinkTelemetry` value, timing, or shared event as an input to compute the result
