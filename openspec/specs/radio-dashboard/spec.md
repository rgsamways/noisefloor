# radio-dashboard Specification

## Purpose
The `radio/*` dashboard component family (`NOISEFLOOR-OUTLINE.md` §7) — the radio-facing instruments a support tech reads to judge whether a link's capacity ceiling and signal are explained by RF fundamentals or point at a real fault. Renders entirely from `World`, same as `crm/LinkCapacityChart`.

## Requirements

### Requirement: LinkHeader renders both link endpoints from World alone
`radio/LinkHeader` SHALL render the CPE ("local") and AP ("remote") devices' model, mode, and any set `mac`/`txPowerDbm`, plus the link's `distanceM`, `linkPotentialPct`, `airtimeTxPct`/`airtimeRxPct`, and `capacityDownMbps`/`capacityUpMbps`, using only a `World` (or a slice of one) as input.

#### Scenario: LinkHeader renders from World data alone
- **WHEN** `LinkHeader` is given a `World`
- **THEN** it SHALL render without requiring any prop beyond that `World` — unlike `crm/LinkCapacityChart`, it has no time-series data to anchor an `Annotation` to, so it doesn't accept one

### Requirement: SignalPanel surfaces chain imbalance without manual subtraction
`radio/SignalPanel` SHALL render both sides' `signalDbm`, per-chain values, and noise floor, and SHALL compute and display each side's chain delta (`max - min` of that side's `chains` array) rather than requiring the viewer to compute it.

#### Scenario: A chain array with unequal values shows a nonzero delta
- **WHEN** `SignalPanel` is given chains `[-69, -74]`
- **THEN** it SHALL display a delta of `5` dB for that side

### Requirement: RateBar shows actual modulation rate against what CINR could support
`radio/RateBar` SHALL render the current modulation rate (1X-8X) as a filled segment bar, and SHALL mark the rate the link's CINR could support using the same expectation table `world-consistency-validator`'s SNR-modulation rule uses (`expectedRateForCinr`, exported from `packages/shared`) — not an independently maintained threshold table.

#### Scenario: RateBar's expected marker matches the validator's own expectation
- **WHEN** `RateBar` is given a CINR value
- **THEN** the rate it marks as "expected" SHALL equal `expectedRateForCinr` applied to that same CINR value

### Requirement: DeviceDetails flags cable SNR below a stated vendor threshold
`radio/DeviceDetails` SHALL render a device's mode, firmware, uptime, memory %, CPU %, wireless fields (CINR, distance, noise floor), and ethernet fields (cable SNR, cable length, and `lanSpeedMbps` if set), and SHALL visually distinguish `cableSnrDb` values below its documented red threshold from values at or above it.

#### Scenario: A cable SNR below the red threshold is visually flagged
- **WHEN** `DeviceDetails` is given a `cableSnrDb` below its documented threshold
- **THEN** that value SHALL render with a distinct visual treatment from a value at or above the threshold

### Requirement: SegmentBar renders a discrete filled/expected segment count
The `SegmentBar` primitive SHALL render `totalCount` discrete segments, fill the first `filledCount` of them, and, when `expectedCount` is provided and differs from `filledCount`, mark that segment distinctly from the filled/unfilled ones.

#### Scenario: expectedCount different from filledCount is marked distinctly
- **WHEN** `SegmentBar` is given `filledCount: 6`, `totalCount: 8`, `expectedCount: 8`
- **THEN** segment 8 SHALL render with a visual marker distinguishing it from both the filled (1-6) and plain-unfilled (7) segments
