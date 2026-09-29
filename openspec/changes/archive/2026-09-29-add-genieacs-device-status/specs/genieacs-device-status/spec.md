## Purpose

Lets noisefloor's backend look up whether a GenieACS-managed CPE device is currently online, as the first proof that noisefloor can read live device state from GenieACS's NBI.

## ADDED Requirements

### Requirement: Query device status by GenieACS device ID
The system SHALL provide an endpoint that accepts a GenieACS device ID and returns that device's online/offline status and last-inform timestamp by querying GenieACS's NBI.

#### Scenario: Device has checked in recently
- **WHEN** a caller requests status for a device ID whose GenieACS record has a `_lastInform` timestamp within the device's expected check-in window
- **THEN** the system returns status "online" and the `_lastInform` timestamp

#### Scenario: Device has not checked in recently
- **WHEN** a caller requests status for a device ID whose GenieACS record has a `_lastInform` timestamp older than the device's expected check-in window
- **THEN** the system returns status "offline" and the `_lastInform` timestamp

#### Scenario: Device ID does not exist in GenieACS
- **WHEN** a caller requests status for a device ID that GenieACS has no record of
- **THEN** the system returns a not-found error and does not return a status field

### Requirement: GenieACS unreachable is a distinct error from device not found
The system SHALL distinguish "GenieACS could not be reached" from "GenieACS was reached but has no such device," so callers do not mistake an infrastructure failure for a genuinely unregistered device.

#### Scenario: GenieACS NBI is unreachable
- **WHEN** a caller requests device status and the configured GenieACS NBI does not respond (connection refused, timeout)
- **THEN** the system returns a distinct upstream-unavailable error, not a not-found error

### Requirement: No customer identity accepted
The system SHALL only accept GenieACS's own device ID as input for this endpoint. It SHALL NOT accept a customer identifier, since no customer-to-device mapping exists yet.

#### Scenario: Caller supplies a customer identifier instead of a device ID
- **WHEN** a caller calls the endpoint with a value that is not a known GenieACS device ID
- **THEN** the system treats it as an unknown device ID (not-found error) rather than attempting any customer lookup
