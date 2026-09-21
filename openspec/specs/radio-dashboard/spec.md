# radio-dashboard Specification

> **Status: Parked, 2026-09-21.** Built for the case-study product; superseded for phase one by the radio-console pivot (`docs/NOISEFLOOR-CONSOLE-HANDOFF.md`). Documents the implementation as built, not under active development. See `PROJECT-PLAN.md` D16.

## Purpose
The `radio/*` dashboard component family (`NOISEFLOOR-OUTLINE.md` §7) — the radio-facing instruments a support tech reads to judge whether a link's capacity ceiling and signal are explained by RF fundamentals or point at a real fault. Renders entirely from `World`, same as `crm/LinkCapacityChart`.

## Requirements

### Requirement: LinkHeader renders both link endpoints from World alone
`radio/LinkHeader` SHALL render the CPE ("local") and AP ("remote") sides as cards headlined by `customer.displayName` and `site.sectorName` respectively (device model as a secondary line), plus each device's mode and any set `mac`/`txPowerDbm`, plus the link's `distanceM`, `linkPotentialPct` (as a `Gauge`), `airtimeTxPct`/`airtimeRxPct`, and `capacityDownMbps`/`capacityUpMbps`, using only a `World` (or a slice of one) as input. Its device cards and gauge may use rounded corners and a shadow, per the dashboard-component visual carve-out in `homepage/DESIGN-NOTES.md`.

#### Scenario: LinkHeader renders from World data alone
- **WHEN** `LinkHeader` is given a `World`
- **THEN** it SHALL render without requiring any prop beyond that `World` — unlike `crm/LinkCapacityChart`, it has no time-series data to anchor an `Annotation` to, so it doesn't accept one

### Requirement: SignalPanel surfaces chain imbalance without manual subtraction
`radio/SignalPanel` SHALL render both sides' `signalDbm`, per-chain values (each as a `LinearMeter` over a −100 to −40 dBm range), and noise floor, and SHALL compute and display each side's chain delta (`max - min` of that side's `chains` array) rather than requiring the viewer to compute it. Its cards may use rounded corners and a shadow, per the dashboard-component visual carve-out in `homepage/DESIGN-NOTES.md`.

#### Scenario: A chain array with unequal values shows a nonzero delta
- **WHEN** `SignalPanel` is given chains `[-69, -74]`
- **THEN** it SHALL display a delta of `5` dB for that side

### Requirement: RateBar shows actual modulation rate against what CINR could support
`radio/RateBar` SHALL render the current modulation rate (1X-8X) as a filled, colored segment bar (via `SegmentBar`'s `segmentColors`), and SHALL mark the rate the link's CINR could support using the same expectation table `world-consistency-validator`'s SNR-modulation rule uses (`expectedRateForCinr`, exported from `packages/shared`) — not an independently maintained threshold table. Its cards may use rounded corners and a shadow, per the dashboard-component visual carve-out in `homepage/DESIGN-NOTES.md`.

#### Scenario: RateBar's expected marker matches the validator's own expectation
- **WHEN** `RateBar` is given a CINR value
- **THEN** the rate it marks as "expected" SHALL equal `expectedRateForCinr` applied to that same CINR value

### Requirement: DeviceDetails flags cable SNR below a stated vendor threshold
`radio/DeviceDetails` SHALL render a device's network mode, firmware, a derived wireless mode ("Station PtMP" for the local/CPE side, "Access Point PtMP" for the remote/AP side), uptime, memory % and CPU % (each as a `LinearMeter`), wireless fields (CINR as a `LinearMeter`, distance, noise floor), and ethernet fields (cable SNR as a `LinearMeter`, cable length, and `lanSpeedMbps` if set), and SHALL visually distinguish `cableSnrDb` values below its documented red threshold from values at or above it. Its card may use rounded corners and a shadow, per the dashboard-component visual carve-out in `homepage/DESIGN-NOTES.md`.

#### Scenario: A cable SNR below the red threshold is visually flagged
- **WHEN** `DeviceDetails` is given a `cableSnrDb` below its documented threshold
- **THEN** that value's `LinearMeter` SHALL render with a distinct visual treatment from a value at or above the threshold

### Requirement: SegmentBar renders a discrete filled/expected segment count
The `SegmentBar` primitive SHALL render `totalCount` discrete segments, fill the first `filledCount` of them, and, when `expectedCount` is provided and differs from `filledCount`, mark that segment distinctly from the filled/unfilled ones.

#### Scenario: expectedCount different from filledCount is marked distinctly
- **WHEN** `SegmentBar` is given `filledCount: 6`, `totalCount: 8`, `expectedCount: 8`
- **THEN** segment 8 SHALL render with a visual marker distinguishing it from both the filled (1-6) and plain-unfilled (7) segments

### Requirement: Gauge renders a circular progress ring with a centered value
The `Gauge` primitive SHALL render a circular ring whose filled arc length is proportional to `value/max`, with the numeric `value` and `label` rendered centered inside the ring.

#### Scenario: A gauge at half value fills half the ring
- **WHEN** `Gauge` is given `value: 50`, `max: 100`
- **THEN** the filled arc SHALL span half the ring's circumference

### Requirement: LinkHeader shows link potential as a gauge, not plain text
`radio/LinkHeader` SHALL render `link.linkPotentialPct` as a `Gauge`, in addition to (not replacing) its existing device-card and distance/airtime/capacity content.

#### Scenario: LinkHeader's gauge reflects the World's link potential
- **WHEN** `LinkHeader` is given a `World` with `link.linkPotentialPct: 52`
- **THEN** it SHALL render a `Gauge` with `value: 52`

### Requirement: SegmentBar supports a per-segment color scale
The `SegmentBar` primitive SHALL accept an optional `segmentColors` array; when provided, segment `n` SHALL use `segmentColors[n-1]` as its filled color instead of the single `filledColor`. When omitted, existing single-color behavior is unchanged.

#### Scenario: A provided segmentColors array colors each filled segment individually
- **WHEN** `SegmentBar` is given `segmentColors` with 8 distinct colors and `filledCount: 3`
- **THEN** the first three segments SHALL each render in their own `segmentColors` entry's color, not a single shared color

#### Scenario: Omitting segmentColors preserves the original single-color behavior
- **WHEN** `SegmentBar` is given no `segmentColors`
- **THEN** all filled segments SHALL render in `filledColor` as before this change

### Requirement: LinearMeter renders a horizontal filled bar proportional to a value's position in a range
The `LinearMeter` primitive SHALL render a horizontal bar whose filled length is proportional to `(value - min) / (max - min)`, clamped to the [0, 1] range, alongside its `label` and `value`.

#### Scenario: A value at the midpoint of its range fills half the bar
- **WHEN** `LinearMeter` is given `value: -70`, `min: -100`, `max: -40`
- **THEN** the filled portion SHALL span half the bar's length

#### Scenario: A value outside the range clamps rather than overflowing or going negative
- **WHEN** `LinearMeter` is given a `value` below `min` or above `max`
- **THEN** the filled portion SHALL render fully empty or fully full respectively, not overflow the bar or render a negative width
