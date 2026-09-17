## Purpose

Deterministic, seeded functions that turn a handful of parameters into the time-series and pinglog data a `World` needs, so authoring a case variant is a one-field parameter change instead of hand-drawn data.

## ADDED Requirements

### Requirement: Generators are deterministic under a seed
Every generator SHALL accept a seed (directly or via the case's own id/seed) such that calling the same generator with the same seed and parameters SHALL always produce byte-identical output.

#### Scenario: Same case renders the same chart on every load
- **WHEN** a case's `World` is resolved twice with the same seed
- **THEN** every generated series SHALL contain identical values both times

### Requirement: diurnalUsage produces a residential daily usage curve
`diurnalUsage({ peakMbps, peakHour, offHours, noise })` SHALL produce a 24-hour series that peaks near `peakHour` at approximately `peakMbps`, drops during `offHours`, and varies by no more than `noise` from its underlying shape.

#### Scenario: Peak hour is respected
- **WHEN** `diurnalUsage` is called with `peakHour: 22`
- **THEN** the generated series' maximum value SHALL fall within one hour of 22:00

### Requirement: noisyCeiling produces a bouncing capacity ceiling
`noisyCeiling({ base, jitter, spikes })` SHALL produce a series that stays within `base ± jitter` except at positions designated by `spikes`.

#### Scenario: Ceiling stays within jitter bounds outside spikes
- **WHEN** `noisyCeiling` is called with `base: 60, jitter: 5` and no spikes configured
- **THEN** every generated value SHALL fall between 55 and 65

### Requirement: foliageYear produces a seasonal signal trace
`foliageYear({ leafOnDbm, leafOffDbm, leafOnDate, leafOffDate, growthDbPerYear })` SHALL produce a one-year series that transitions between `leafOffDbm` and `leafOnDbm` at the given dates, offset by `growthDbPerYear` for years beyond the first.

#### Scenario: Leaf-on date marks a signal transition
- **WHEN** `foliageYear` is called with `leafOnDate: "05-24"`
- **THEN** the generated series SHALL show its transition toward `leafOnDbm` beginning at that date

### Requirement: shaperCollapse drops throughput at a configured timestamp
`shaperCollapse({ at, toKbps })` SHALL produce a series that holds its prior value until `at`, then drops to `toKbps` for the remainder of the series.

#### Scenario: Throughput collapses exactly at the configured time
- **WHEN** `shaperCollapse` is called with `at: "11:56", toKbps: 50`
- **THEN** every value at or after 11:56 SHALL be at or near 50 kbit/s, and every value before it SHALL be unaffected

### Requirement: pinglogMonth produces a day-by-minute grid reflecting configured outages
`pinglogMonth({ baseLossPct, outages, eveningSpeckle })` SHALL produce a grid of `ok` / `slow` / `loss` values, one per day per minute-bucket, where each configured outage's window reads `loss` and the rest of the grid reflects `baseLossPct` and `eveningSpeckle`.

#### Scenario: A configured outage appears in the grid
- **WHEN** `pinglogMonth` is called with an outage `{ start: "2026-08-14T02:00", minutes: 20 }`
- **THEN** the grid cells covering that day and minute range SHALL read `loss`

### Requirement: A SeriesRef resolves whether it is inline data or a generator spec
A `SeriesRef` SHALL be either an inline array of `{ t, v }` points or `{ gen: <generator name>, params }`. Resolving a `SeriesRef` of either form SHALL produce the same downstream shape: an array of `{ t, v }` points.

#### Scenario: Inline and generator-backed series are interchangeable to a renderer
- **WHEN** a dashboard component receives a resolved `SeriesRef`, regardless of whether it originated as inline points or a generator spec
- **THEN** it SHALL render identically without needing to know which form the source data took
