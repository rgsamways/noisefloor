## ADDED Requirements

### Requirement: The engine produces ServiceLayerTelemetry snapshots
The engine SHALL provide a function that produces a fully valid `ServiceLayerTelemetry` value at a given point in simulated time, given a scenario, mirroring how `simulateRadioLink` produces `RadioLinkTelemetry`.

#### Scenario: A healthy-baseline service-layer snapshot validates
- **WHEN** the engine generates a service-layer snapshot with no active fault
- **THEN** the result SHALL be a fully valid `ServiceLayerTelemetry` per the `console-schema` Zod schema, with `dhcpLease.present` true and exactly one of `nat.upstreamPresent`/`nat.customerSidePresent` true

### Requirement: Service-layer faults are discrete state changes, not continuous degradation
The engine SHALL apply service-layer faults as a fault definition that specifies which fields change and what they change to at/after a trigger time, without requiring a continuous scalar (such as `linkHealth`) to drive the change.

#### Scenario: A service-layer fault does not require a linkHealth value
- **WHEN** a service-layer fault is defined and applied to produce a `ServiceLayerTelemetry` snapshot
- **THEN** the engine SHALL NOT require any `linkHealth` or radio-link scalar as an input to compute the result

### Requirement: Expired lease flips DHCP state to a self-assigned, useless address
The engine SHALL support an "expired lease" fault that, once triggered, sets `dhcpLease.present` to `false` and reports a self-assigned-looking `leaseAddress` distinct from `expectedAddress`.

#### Scenario: Expired lease shows no valid lease and a useless address
- **WHEN** an "expired lease" fault has triggered by the time of a snapshot
- **THEN** `dhcpLease.present` SHALL read `false`, and `leaseAddress` SHALL differ from `expectedAddress`

### Requirement: Double NAT sets both NAT layers present simultaneously
The engine SHALL support a "double NAT" fault that, once triggered, sets both `nat.upstreamPresent` and `nat.customerSidePresent` to `true` simultaneously.

#### Scenario: Double NAT shows both NAT layers active
- **WHEN** a "double NAT" fault has triggered by the time of a snapshot
- **THEN** `nat.upstreamPresent` SHALL read `true` and `nat.customerSidePresent` SHALL read `true` in the same snapshot
