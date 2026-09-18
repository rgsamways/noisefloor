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
An RF link's chain-to-chain signal imbalance greater than 3 dB SHALL produce a soft tension. (A distance/channel-frequency-derived expected-signal check, also named in `NOISEFLOOR-AUTHORING-PLAN.md` §3.2, is deliberately **not** part of this change: `World`'s `link` schema has no TX power or antenna gain fields, so an accurate expected-signal figure isn't computable from what exists today — adding it is a follow-up once those fields are modeled, not a gap to paper over with a guessed formula.)

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

### Requirement: Shaper-related throughput collapse is checked for a units mistake
`World`/`WorldEvent` has no structured "configured shaper rate" field — only a free-text event label and the resulting series — so this check works from series shape, not a stored cap value. When an event's label identifies it as shaper-related and the throughput series drops to a sustained low plateau at or after that timestamp, a plateau under 1 Mbit/s SHALL produce a soft tension suggesting the value may have been entered in kbit/s. (Checking that throughput never *exceeds* a configured cap is deliberately not part of this change — there's no independent cap value to check it against; revisit once `WorldEvent` or a shaper-specific field models one.)

#### Scenario: A suspiciously low post-event throughput plateau suggests a unit mistake
- **WHEN** a shaper-labeled event is followed by a throughput series that drops to a sustained plateau under 1 Mbit/s
- **THEN** `validateWorld` SHALL return a soft tension suggesting the value may be in kbit/s

### Requirement: Every event is reflected in the series it should affect
Every `WorldEvent` SHALL correspond to a visible effect in at least one of the `World`'s series at or after its timestamp. An event with no corresponding effect SHALL produce a hard tension.

#### Scenario: An unreflected event is a hard tension
- **WHEN** a `World` includes a reboot `WorldEvent` but no series shows a connection-time reset or throughput gap at that timestamp
- **THEN** `validateWorld` SHALL return a hard tension naming that event
