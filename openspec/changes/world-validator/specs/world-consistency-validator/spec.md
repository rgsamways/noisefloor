## Purpose

Checks whether a `World`'s numbers actually agree with each other and with RF/networking physics, so internally inconsistent case data gets caught before it ships — whether hand-authored (curated v1 cases) or, later, built through a user-facing tool.

## ADDED Requirements

### Requirement: Validation always returns explained tensions, never a bare failure
`validateWorld(world)` SHALL return an array of tensions. It SHALL NOT throw, and SHALL NOT return an unexplained boolean or a bare "invalid" result. Each tension SHALL include the rule that produced it, a `severity` of `"hard"` or `"soft"`, the fields involved, a plain-language `message`, and at least one suggested `resolution`.

#### Scenario: A fully consistent World produces no tensions
- **WHEN** `validateWorld` is called with a `World` whose values are all mutually consistent
- **THEN** it SHALL return an empty array

#### Scenario: Every tension names what's wrong and suggests a fix
- **WHEN** `validateWorld` finds any inconsistency
- **THEN** every returned tension SHALL include a non-empty `message` and at least one `resolution`, and SHALL NOT use the words "invalid" or "error" in its message

### Requirement: RF link budget consistency
An RF link's chain-to-chain signal imbalance greater than 3 dB SHALL produce a soft tension. A link's actual signal more than a configured threshold below the value expected from distance and channel frequency SHALL produce a soft tension.

#### Scenario: Chain imbalance beyond 3 dB is flagged
- **WHEN** `link.chainsLocal` is `[-69, -74]` (a 5 dB spread)
- **THEN** `validateWorld` SHALL return a soft tension naming `link.chainsLocal`

### Requirement: Signal-to-noise consistency with modulation rate
A link's CINR SHALL be consistent with its signal and noise floor within a tolerance; a mismatch SHALL produce a soft tension. A modulation rate that exceeds what the link's CINR can support SHALL produce a hard tension; a rate lower than what CINR supports SHALL produce a soft tension.

#### Scenario: An impossibly high modulation rate for the given CINR is a hard tension
- **WHEN** a `World`'s `link.cinrLocalDb` is too low to support `link.rateLocal: 8`
- **THEN** `validateWorld` SHALL return a hard tension naming `link.rateLocal`

### Requirement: Modulation, width, and TDD share bound the achievable capacity
A link's `capacityDownMbps`/`capacityUpMbps` SHALL fall within the band derivable from its modulation rate, channel width, and TDD overhead assumptions. A value outside that band SHALL produce a hard tension.

#### Scenario: Capacity far outside the physically achievable band is a hard tension
- **WHEN** a `World` has a 20 MHz channel and 6X modulation but claims 500 Mbps capacity
- **THEN** `validateWorld` SHALL return a hard tension naming `link.capacityDownMbps`

### Requirement: Shaper and throughput coherence
When a `World`'s events include a shaper change, the throughput series after that event's timestamp SHALL NOT exceed the configured shaper rate. A configured shaper rate under 1 Mbit/s SHALL produce a soft tension suggesting a kbit/s-vs-Mbit/s unit mistake.

#### Scenario: Throughput exceeding a configured shaper cap is a hard tension
- **WHEN** a shaper event sets a 50 kbit/s cap but the throughput series shows 30 Mbit/s after that timestamp
- **THEN** `validateWorld` SHALL return a hard tension naming the throughput series and the shaper event

#### Scenario: A suspiciously low shaper value suggests a unit mistake
- **WHEN** a shaper event's configured rate is `0.05` (interpretable as 0.05 Mbit/s)
- **THEN** `validateWorld` SHALL return a soft tension suggesting the value may be in kbit/s

### Requirement: Every event is reflected in the series it should affect
Every `WorldEvent` SHALL correspond to a visible effect in at least one of the `World`'s series at or after its timestamp. An event with no corresponding effect SHALL produce a hard tension.

#### Scenario: An unreflected event is a hard tension
- **WHEN** a `World` includes a reboot `WorldEvent` but no series shows a connection-time reset or throughput gap at that timestamp
- **THEN** `validateWorld` SHALL return a hard tension naming that event
