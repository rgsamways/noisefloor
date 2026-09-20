## ADDED Requirements

### Requirement: LinearMeter renders a horizontal filled bar proportional to a value's position in a range
The `LinearMeter` primitive SHALL render a horizontal bar whose filled length is proportional to `(value - min) / (max - min)`, clamped to the [0, 1] range, alongside its `label` and `value`.

#### Scenario: A value at the midpoint of its range fills half the bar
- **WHEN** `LinearMeter` is given `value: -70`, `min: -100`, `max: -40`
- **THEN** the filled portion SHALL span half the bar's length

#### Scenario: A value outside the range clamps rather than overflowing or going negative
- **WHEN** `LinearMeter` is given a `value` below `min` or above `max`
- **THEN** the filled portion SHALL render fully empty or fully full respectively, not overflow the bar or render a negative width

## MODIFIED Requirements

### Requirement: SignalPanel surfaces chain imbalance without manual subtraction
`radio/SignalPanel` SHALL render both sides' `signalDbm`, per-chain values (each as a `LinearMeter` over a −100 to −40 dBm range), and noise floor, and SHALL compute and display each side's chain delta (`max - min` of that side's `chains` array) rather than requiring the viewer to compute it. Its cards may use rounded corners and a shadow, per the dashboard-component visual carve-out in `homepage/DESIGN-NOTES.md`.

#### Scenario: A chain array with unequal values shows a nonzero delta
- **WHEN** `SignalPanel` is given chains `[-69, -74]`
- **THEN** it SHALL display a delta of `5` dB for that side

### Requirement: DeviceDetails flags cable SNR below a stated vendor threshold
`radio/DeviceDetails` SHALL render a device's mode, firmware, uptime, memory %, CPU %, wireless fields (CINR as a `LinearMeter`, distance, noise floor), and ethernet fields (cable SNR as a `LinearMeter`, cable length, and `lanSpeedMbps` if set), and SHALL visually distinguish `cableSnrDb` values below its documented red threshold from values at or above it. Its card may use rounded corners and a shadow, per the dashboard-component visual carve-out in `homepage/DESIGN-NOTES.md`.

#### Scenario: A cable SNR below the red threshold is visually flagged
- **WHEN** `DeviceDetails` is given a `cableSnrDb` below its documented threshold
- **THEN** that value's `LinearMeter` SHALL render with a distinct visual treatment from a value at or above the threshold
