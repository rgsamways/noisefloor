# radio-console-schema Specification

## Purpose
Defines the normalized, vendor-neutral telemetry schema the radio console reads and writes — a radio-link shape, a separate service-layer shape, and the staleness/link-profile types both depend on — so the simulation engine, the UI, and any future real vendor driver all speak the same shape (`docs/NOISEFLOOR-CONSOLE-HANDOFF.md` §4–§6).

## Requirements

### Requirement: RadioLinkTelemetry groups fields per the handoff doc's five groups
`RadioLinkTelemetry` SHALL expose exactly five top-level field groups — `link`, `throughput`, `farEnd`, `radioHealth`, `timeEvidence` — matching `docs/NOISEFLOOR-CONSOLE-HANDOFF.md` §4/§4a. `timeEvidence` SHALL NOT be nested inside `radioHealth`.

#### Scenario: A representative healthy-baseline object validates
- **WHEN** an object with all five groups populated with plausible healthy values is validated against `RadioLinkTelemetry`
- **THEN** it SHALL be accepted

#### Scenario: timeEvidence is addressable independently of radioHealth
- **WHEN** a `RadioLinkTelemetry` object is inspected
- **THEN** `timeEvidence.lastReboot`, `timeEvidence.lastLogEntry`, and `timeEvidence.lastSuccessfulPoll` SHALL each be accessible as siblings of `radioHealth`, not fields within it

### Requirement: Every leaf field carries independent staleness
Every leaf field in `RadioLinkTelemetry` and `ServiceLayerTelemetry` SHALL be wrapped in a `Reading<T>` type carrying `{value: T; asOf: string}`, so two fields in the same object can be independently fresh or stale.

#### Scenario: Two fields in the same object have different staleness
- **WHEN** a `RadioLinkTelemetry` object has `link.chainImbalanceDb.asOf` set to the current time and `farEnd.latencyMs.asOf` set to ten minutes earlier
- **THEN** both SHALL validate, and each field's staleness SHALL be independently derivable from its own `asOf`

#### Scenario: A malformed timestamp is rejected
- **WHEN** a `Reading<T>` is given an `asOf` that is not a valid ISO timestamp
- **THEN** validation SHALL fail

### Requirement: ServiceLayerTelemetry is a distinct top-level shape
`ServiceLayerTelemetry` SHALL be a separate type from `RadioLinkTelemetry`, covering DHCP lease state, addressing, and NAT per `docs/NOISEFLOOR-CONSOLE-HANDOFF.md` §5. It SHALL NOT be nested inside or merged with `RadioLinkTelemetry`.

#### Scenario: A healthy service-layer object validates independently of any radio-link data
- **WHEN** a `ServiceLayerTelemetry` object is validated on its own, with no `RadioLinkTelemetry` present
- **THEN** it SHALL be accepted

### Requirement: LinkProfile carries the context needed to judge normalcy, without judging it
`LinkProfile` SHALL expose `distanceKm`, `band`, and `gearClass`. It SHALL carry no logic that computes or classifies whether a given `RadioLinkTelemetry` reading is normal for that profile — that determination is explicitly out of scope for this schema.

#### Scenario: LinkProfile validates as pure data
- **WHEN** a `LinkProfile` object is validated
- **THEN** it SHALL be accepted based on its three fields alone, with no dependency on any `RadioLinkTelemetry` or `ServiceLayerTelemetry` value

### Requirement: vendorExtras accepts fields the core schema does not model
`RadioLinkTelemetry` SHALL include a `vendorExtras: Record<string, unknown>` field so a future vendor driver can carry a reading that doesn't map to any core field, rather than forcing it into one that doesn't fit.

#### Scenario: An unmapped vendor-specific value is representable
- **WHEN** a `RadioLinkTelemetry` object sets `vendorExtras: { airmaxQuality: 87 }`
- **THEN** it SHALL be accepted without requiring `airmaxQuality` to be declared as a core field
