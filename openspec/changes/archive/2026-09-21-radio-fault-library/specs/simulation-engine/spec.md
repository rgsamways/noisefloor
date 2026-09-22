## ADDED Requirements

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
