## MODIFIED Requirements

### Requirement: Wind misalignment applies a sudden, persistent step change to chain imbalance
The engine SHALL support a "wind misalignment" fault that, at a single trigger point, steps `chainImbalanceDb` to roughly 5 dB or greater — a field-confirmed threshold at which a real tech would call misalignment obvious — AND steps the link's signal-related readings (`signalDbm`, `snrDb`) down to a degraded level, matching real misalignment's primary tell: a signal/SNR step-down with the noise floor unchanged. Neither effect recovers on its own.

#### Scenario: Wind misalignment steps chain imbalance down and stays down
- **WHEN** a "wind misalignment" fault triggers during a simulation run
- **THEN** `chainImbalanceDb` SHALL shift to a value of roughly 5 dB or greater within one snapshot of the trigger point and SHALL remain at that degraded level for the remainder of the run, absent an explicit un-trigger

#### Scenario: Wind misalignment also steps signal and SNR down and stays down
- **WHEN** a "wind misalignment" fault triggers during a simulation run
- **THEN** `signalDbm` and `snrDb` SHALL drop below their healthy-baseline values within one snapshot of the trigger point and SHALL remain degraded for the remainder of the run, while `noiseFloorDbm` SHALL remain at its healthy-baseline value

### Requirement: Interference applies an intermittent, cyclical degradation
The engine SHALL support an "interference" fault using the `intermittentCycle` shape, configurable to a daily-rhythm cycle period, that raises `noiseFloorDbm` above its healthy-baseline value only during its active windows, while leaving `signalDbm` at its healthy-baseline value throughout — matching interference's real diagnostic signature (noise rises, signal unchanged), distinct from Wind Misalignment, Rain Fade, and Foliage Growth, which all degrade signal while leaving noise floor unchanged.

#### Scenario: Interference degrades only during its active windows
- **WHEN** an "interference" fault is active during part of a simulated day and a snapshot is taken inside one of its active windows, and separately a snapshot is taken outside any active window
- **THEN** the snapshot inside an active window SHALL show `noiseFloorDbm` above its healthy-baseline value and `signalDbm` at its healthy-baseline value, and the snapshot outside any active window SHALL show `noiseFloorDbm` at its healthy-baseline value

## ADDED Requirements

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
