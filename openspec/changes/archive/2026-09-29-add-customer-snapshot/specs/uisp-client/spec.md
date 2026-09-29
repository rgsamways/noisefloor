## Purpose

Lets noisefloor read a UISP-managed radio's current status and readings, the same way `genieacs-device-status` already does for GenieACS-managed routers — the radio half of a customer's setup.

## ADDED Requirements

### Requirement: A caller holding the right rule can retrieve a UISP device's detail by its UISP device ID
The system SHALL provide an endpoint that takes a UISP device ID and returns that device's identity, status, and available readings, gated the same way the equivalent GenieACS endpoint is gated (a group rule, not siteAdmin-only).

#### Scenario: A holder retrieves an online device's detail
- **WHEN** a caller holding the required rule requests detail for a UISP device ID that UISP reports as online
- **THEN** the system SHALL return that device's identity and readings with an online status

#### Scenario: A caller without the rule is rejected
- **WHEN** a caller lacking the required rule requests a UISP device's detail
- **THEN** the system SHALL reject the request, matching the existing GenieACS endpoint's rejection behavior

### Requirement: UISP-unreachable is distinct from device-not-found
The system SHALL distinguish "UISP could not be reached" from "UISP was reached but has no such device," mirroring the existing GenieACS client's `GenieAcsUnavailableError` vs. not-found distinction.

#### Scenario: UISP is unreachable
- **WHEN** the configured UISP instance does not respond (connection refused, timeout, certificate error)
- **THEN** the system SHALL return a distinct upstream-unavailable error, not a not-found error

#### Scenario: UISP has no device with the given ID
- **WHEN** UISP is reached but reports no device matching the given ID
- **THEN** the system SHALL return a not-found error

### Requirement: Device detail is returned per its UISP hardware family
The system SHALL resolve which UISP endpoint to query based on the device's hardware family (e.g. `airMax`), since UISP itself splits device-detail responses by family rather than exposing one universal shape.

#### Scenario: An airMax device's detail includes its family-specific readings
- **WHEN** a caller requests detail for a device UISP reports as an `airMax` device
- **THEN** the system SHALL return that family's readings (at minimum: signal, frequency, uptime)
