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
The engine SHALL support a "wind misalignment" fault whose primary, diagnosable signature is `chainImbalanceDb` stepping to roughly 5 dB or greater at a single point in time — a field-confirmed threshold at which a real tech would call misalignment obvious — and does not recover on its own.

#### Scenario: Wind misalignment steps chain imbalance down and stays down
- **WHEN** a "wind misalignment" fault triggers during a simulation run
- **THEN** `chainImbalanceDb` SHALL shift to a value of roughly 5 dB or greater within one snapshot of the trigger point and SHALL remain at that degraded level for the remainder of the run, absent an explicit un-trigger

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

### Requirement: Cable degradation applies a gradual, non-recovering ramp
The engine SHALL support a "cable degradation" fault (water ingress / failing cable) using the `rampPersist` shape, degrading over a duration configurable up to multiple weeks, that does not recover without an explicit un-trigger.

#### Scenario: Cable degradation worsens gradually and plateaus
- **WHEN** a "cable degradation" fault triggers during a simulation run
- **THEN** the affected readings SHALL degrade progressively over the fault's configured ramp period and remain at the degraded level for snapshots taken well after the ramp completes

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
The engine SHALL support an "interference" fault using the `intermittentCycle` shape, configurable to a daily-rhythm cycle period, that degrades affected readings only during its active windows.

#### Scenario: Interference degrades only during its active windows
- **WHEN** an "interference" fault is active during part of a simulated day and a snapshot is taken inside one of its active windows, and separately a snapshot is taken outside any active window
- **THEN** the snapshot inside an active window SHALL show degraded readings relative to the healthy baseline, and the snapshot outside any active window SHALL match the healthy baseline
