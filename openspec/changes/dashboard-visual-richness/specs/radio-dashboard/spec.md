## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: LinkHeader renders both link endpoints from World alone
`radio/LinkHeader` SHALL render the CPE ("local") and AP ("remote") devices' model, mode, and any set `mac`/`txPowerDbm`, plus the link's `distanceM`, `linkPotentialPct` (as a `Gauge`), `airtimeTxPct`/`airtimeRxPct`, and `capacityDownMbps`/`capacityUpMbps`, using only a `World` (or a slice of one) as input. Its device cards and gauge may use rounded corners and a shadow, per the dashboard-component visual carve-out in `homepage/DESIGN-NOTES.md`.

#### Scenario: LinkHeader renders from World data alone
- **WHEN** `LinkHeader` is given a `World`
- **THEN** it SHALL render without requiring any prop beyond that `World` — unlike `crm/LinkCapacityChart`, it has no time-series data to anchor an `Annotation` to, so it doesn't accept one

### Requirement: RateBar shows actual modulation rate against what CINR could support
`radio/RateBar` SHALL render the current modulation rate (1X-8X) as a filled, colored segment bar (via `SegmentBar`'s `segmentColors`), and SHALL mark the rate the link's CINR could support using the same expectation table `world-consistency-validator`'s SNR-modulation rule uses (`expectedRateForCinr`, exported from `packages/shared`) — not an independently maintained threshold table. Its cards may use rounded corners and a shadow, per the dashboard-component visual carve-out in `homepage/DESIGN-NOTES.md`.

#### Scenario: RateBar's expected marker matches the validator's own expectation
- **WHEN** `RateBar` is given a CINR value
- **THEN** the rate it marks as "expected" SHALL equal `expectedRateForCinr` applied to that same CINR value
