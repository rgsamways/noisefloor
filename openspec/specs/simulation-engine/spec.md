# simulation-engine Specification

## Purpose
Defines the behavior of the simulation engine that produces `RadioLinkTelemetry` snapshots over simulated time — correlated field movement, a healthy baseline relative to a link's profile, visible staleness on a dropped far end, and an extensible fault mechanism proven with two representative time-signatures.

## Requirements

### Requirement: Degraded signal produces correlated movement in dependent fields
When a scenario's signal reading degrades, the engine SHALL also move SNR, TX/RX rate, and retry-related readings in the direction a real radio would move them (SNR down, rate stepped down, retries/errors up) within the same snapshot or the snapshots immediately following the change — not hold them at healthy-baseline values while only signal moves.

#### Scenario: A signal drop is not reported in isolation
- **WHEN** a scenario's underlying signal condition degrades from a healthy value to a degraded one
- **THEN** the engine's output SHALL show `snrDb` lower than its healthy-baseline value, `txRateMbps`/`rxRateMbps` no higher than their healthy-baseline value, and `errorsRetries` no lower than its healthy-baseline value, at some point during or immediately after the degradation

### Requirement: Healthy-baseline output is relative to the given LinkProfile
Given a `LinkProfile`, the engine's healthy-baseline output SHALL reflect values plausible for that profile's distance, band, and gear class, rather than one fixed set of "healthy" numbers reused regardless of profile.

#### Scenario: Two different link profiles produce different healthy baselines
- **WHEN** the engine generates healthy-baseline output for a short-distance `LinkProfile` and separately for a long-distance `LinkProfile`
- **THEN** the two outputs' `signalDbm` and `distanceKm` values SHALL differ in the direction consistent with their respective profiles, and both SHALL be reported as a healthy baseline (no active fault) for their own profile

### Requirement: A dropped far end produces visible staleness, not a silent freeze
When a scenario simulates the far end going unreachable, the engine SHALL stop advancing that side's field values while continuing to expose their last-known `value`, and SHALL NOT advance those fields' `asOf` timestamps to reflect a fresh reading that did not occur.

#### Scenario: Far-end fields stop updating but remain visible
- **WHEN** a scenario simulates the far end dropping partway through a run
- **THEN** far-end fields' `value` SHALL stop changing from the moment of the drop, and their `asOf` SHALL remain fixed at the timestamp of the last successful reading rather than advancing with each subsequent snapshot

### Requirement: Faults are defined through an extensible time-signature shape, not one-off logic
The engine SHALL support at least two time-signature shapes — a sudden, persistent step change, and a gradual ramp that later recovers — as a general mechanism that a fault definition parameterizes (affected fields, magnitude, timing), not as hardcoded per-fault branching that a new fault cannot reuse.

#### Scenario: A new fault can be expressed as a parameterization of an existing shape
- **WHEN** a fault is defined using the sudden-step shape or the gradual-ramp-and-recover shape with its own affected fields and magnitude
- **THEN** the engine SHALL apply that shape's timing behavior to the specified fields without requiring new branching logic specific to that fault

### Requirement: Wind misalignment applies a sudden, persistent step change to chain imbalance
The engine SHALL support a "wind misalignment" fault that, at a single trigger point, steps `chainImbalanceDb` to roughly 5 dB or greater — a field-confirmed threshold at which a real tech would call misalignment obvious — AND steps the link's signal-related readings (`signalDbm`, `snrDb`) down to a degraded level, matching real misalignment's primary tell: a signal/SNR step-down with the noise floor unchanged. Neither effect recovers on its own.

#### Scenario: Wind misalignment steps chain imbalance down and stays down
- **WHEN** a "wind misalignment" fault triggers during a simulation run
- **THEN** `chainImbalanceDb` SHALL shift to a value of roughly 5 dB or greater within one snapshot of the trigger point and SHALL remain at that degraded level for the remainder of the run, absent an explicit un-trigger

#### Scenario: Wind misalignment also steps signal and SNR down and stays down
- **WHEN** a "wind misalignment" fault triggers during a simulation run
- **THEN** `signalDbm` and `snrDb` SHALL drop below their healthy-baseline values within one snapshot of the trigger point and SHALL remain degraded for the remainder of the run, while `noiseFloorDbm` SHALL remain at its healthy-baseline value

### Requirement: Rain fade applies a gradual ramp that recovers over a configurable duration
The engine SHALL support a "rain fade" fault that degrades signal-related readings gradually over a configurable duration and then returns them to their healthy-baseline trajectory without external intervention. The engine SHALL NOT hardcode this duration to a single fixed timescale — real rain fade durations track how long the rain itself lasts, which can range from minutes to multiple hours.

#### Scenario: Rain fade ramps down and recovers
- **WHEN** a "rain fade" fault triggers during a simulation run with a given ramp/hold/recover duration
- **THEN** the affected signal-related fields SHALL degrade progressively over the fault's configured ramp period, reach a low point, and return to values consistent with the run's healthy baseline by the end of the fault's configured duration

#### Scenario: Rain fade supports an hours-long duration, not just minutes
- **WHEN** a "rain fade" fault is configured with a ramp/hold/recover duration spanning multiple hours
- **THEN** the engine SHALL accept that configuration and apply the same ramp-hold-recover behavior over the longer timescale

### Requirement: A gradual, non-recovering time-signature shape is available
The engine SHALL support a "rampPersist" time-signature shape that ramps a fault's effect in over a configured duration and then holds it indefinitely, without automatically recovering — distinct from `rampRecover`, which always ends in recovery.

#### Scenario: rampPersist ramps in and never recovers on its own
- **WHEN** a fault using the `rampPersist` shape triggers and enough simulated time passes for its ramp to complete
- **THEN** the affected fields SHALL reach and remain at the degraded level for all subsequent snapshots, with no ramp-out or recovery phase

### Requirement: Foliage growth applies a gradual, non-recovering ramp over a longer timescale
The engine SHALL support a "foliage growth" fault using the `rampPersist` shape, with a configurable ramp duration suited to a multi-week-to-seasonal timescale, that does not recover without an explicit un-trigger.

#### Scenario: Foliage growth worsens gradually and plateaus
- **WHEN** a "foliage growth" fault triggers during a simulation run
- **THEN** the affected readings SHALL degrade progressively over the fault's configured ramp period and remain at the degraded level for snapshots taken well after the ramp completes

### Requirement: An intermittent, cyclical time-signature shape is available
The engine SHALL support an "intermittentCycle" time-signature shape that repeats a configured cycle period, applying a fault's effect only during a configured active portion of each cycle, so the affected fields alternate between healthy-baseline and degraded on a repeating schedule rather than following a single ramp or step.

#### Scenario: intermittentCycle alternates between active and inactive within each cycle
- **WHEN** a fault using the `intermittentCycle` shape is evaluated at a point inside its configured active window for the current cycle, and separately at a point outside that window in the same cycle
- **THEN** the fault SHALL apply its degrading effect at the first point and SHALL NOT apply it at the second

#### Scenario: intermittentCycle repeats across multiple cycles
- **WHEN** a fault using the `intermittentCycle` shape is evaluated at equivalent points in two different, later cycles
- **THEN** the fault SHALL apply the same active/inactive pattern in each cycle

### Requirement: Interference applies an intermittent, cyclical degradation
The engine SHALL support an "interference" fault using the `intermittentCycle` shape, configurable to a daily-rhythm cycle period, that raises `noiseFloorDbm` above its healthy-baseline value only during its active windows, while leaving `signalDbm` at its healthy-baseline value throughout — matching interference's real diagnostic signature (noise rises, signal unchanged), distinct from Wind Misalignment, Rain Fade, and Foliage Growth, which all degrade signal while leaving noise floor unchanged.

#### Scenario: Interference degrades only during its active windows
- **WHEN** an "interference" fault is active during part of a simulated day and a snapshot is taken inside one of its active windows, and separately a snapshot is taken outside any active window
- **THEN** the snapshot inside an active window SHALL show `noiseFloorDbm` above its healthy-baseline value and `signalDbm` at its healthy-baseline value, and the snapshot outside any active window SHALL show `noiseFloorDbm` at its healthy-baseline value

### Requirement: Noise floor is an independently fault-movable reading
The engine SHALL support faults that move `noiseFloorDbm` independently of signal-related readings, so a fault can raise noise floor while leaving signal at its healthy-baseline value, or degrade signal while leaving noise floor at its healthy-baseline value.

#### Scenario: A fault raises noise floor without moving signal
- **WHEN** a fault targeting the noise-floor axis is active
- **THEN** `noiseFloorDbm` SHALL read above its healthy-baseline value while `signalDbm` SHALL remain at its healthy-baseline value

#### Scenario: A fault degrades signal without moving noise floor
- **WHEN** a fault targeting the signal axis (`linkHealth`) is active
- **THEN** `signalDbm` SHALL read below its healthy-baseline value while `noiseFloorDbm` SHALL remain at its healthy-baseline value

### Requirement: Link quality and modulation index derive from SNR deficit, not raw signal health
`linkQualityPct` and `modulationIndex` SHALL degrade in response to a drop in SNR (signal minus noise floor) relative to the healthy-baseline SNR, regardless of whether that drop originates from a signal-axis fault or a noise-floor-axis fault.

#### Scenario: Noise-floor-driven SNR loss degrades quality and modulation
- **WHEN** a fault raises noise floor enough to reduce SNR below its healthy-baseline value, with signal unchanged
- **THEN** `linkQualityPct` SHALL read below its healthy-baseline value and `modulationIndex` SHALL read below its healthy-baseline value

#### Scenario: Signal-driven SNR loss still degrades quality and modulation
- **WHEN** a fault reduces signal enough to reduce SNR below its healthy-baseline value, with noise floor unchanged
- **THEN** `linkQualityPct` SHALL read below its healthy-baseline value and `modulationIndex` SHALL read below its healthy-baseline value

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

### Requirement: Customer router offline drops LAN-port link state
The engine SHALL support a "customer router offline" fault that, once triggered, sets `ServiceLayerTelemetry`'s LAN-port link state to indicate no active link, while leaving `dhcpLease`, `addressing`, and `nat` unaffected by this fault specifically.

#### Scenario: Customer router offline drops the LAN link and nothing else
- **WHEN** a "customer router offline" fault has triggered by the time of a snapshot, with no other fault active
- **THEN** the LAN-port link state SHALL indicate no active link, and `dhcpLease`, `addressing`, and `nat` SHALL match their healthy-baseline values

### Requirement: Cable degradation degrades the LAN-port Ethernet link, not RF fields
The engine SHALL support a "cable degradation" fault that, once triggered, reduces `lanPort.linkSpeedMbps` below its healthy-baseline value and raises `lanPort.crcErrorCount` above zero, while leaving `lanPort.linkUp` `true` and leaving `dhcpLease`, `addressing`, `nat`, and every `RadioLinkTelemetry` field at their healthy-baseline values.

#### Scenario: Cable degradation shows a degraded-but-connected LAN port
- **WHEN** a "cable degradation" fault has triggered by the time of a `ServiceLayerTelemetry` snapshot
- **THEN** `lanPort.linkUp` SHALL read `true`, `lanPort.linkSpeedMbps` SHALL be below its healthy-baseline value, and `lanPort.crcErrorCount` SHALL be greater than `0`

#### Scenario: Cable degradation does not require or affect any RadioLinkTelemetry value
- **WHEN** a "cable degradation" fault is defined and applied to produce a `ServiceLayerTelemetry` snapshot
- **THEN** the engine SHALL NOT require any `RadioLinkTelemetry` value as an input to compute the result, and a `RadioLinkTelemetry` snapshot for the same link taken at the same time SHALL be unaffected by whether this fault is active

### Requirement: Wrong boot order produces the same broken-lease state as an expired lease
The engine SHALL support a "wrong boot order" fault that, once triggered, produces the same `ServiceLayerTelemetry` effect as the "expired lease" fault (`dhcpLease.present` false, a self-assigned-looking `leaseAddress` distinct from `expectedAddress`), without requiring any timing coordination with `RadioLinkTelemetry` simulation.

#### Scenario: Wrong boot order shows the same broken lease state as expired lease
- **WHEN** a "wrong boot order" fault has triggered by the time of a snapshot
- **THEN** `dhcpLease.present` SHALL read `false`, and `leaseAddress` SHALL differ from `expectedAddress`, matching the "expired lease" fault's effect

#### Scenario: Wrong boot order does not require any RadioLinkTelemetry input
- **WHEN** a "wrong boot order" fault is defined and applied to produce a `ServiceLayerTelemetry` snapshot
- **THEN** the engine SHALL NOT require any `RadioLinkTelemetry` value, timing, or shared event as an input to compute the result
