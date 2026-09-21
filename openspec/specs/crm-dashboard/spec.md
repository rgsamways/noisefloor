# crm-dashboard Specification

> **Status: Parked, 2026-09-21.** Built for the case-study product; superseded for phase one by the radio-console pivot (`docs/NOISEFLOOR-CONSOLE-HANDOFF.md`). Documents the implementation as built, not under active development. See `PROJECT-PLAN.md` D16.

## Purpose
The `crm/*` dashboard component family (`NOISEFLOOR-OUTLINE.md` §7) beyond `LinkCapacityChart`, which keeps its own dedicated capability. Renders entirely from `World`, same discipline as every other dashboard component.

## Requirements

### Requirement: RealtimePingModal renders a ping-sample burst by target label
`crm/RealtimePingModal` SHALL render the `World.realtimePings` entry matching a given `targetLabel` as a bar per sample (RTT height; dropped packets, `null`, visually distinct), with average RTT and loss % computed from the samples themselves rather than stored separately — using only a `World` and that label as input.

#### Scenario: RealtimePingModal renders the matching snapshot's samples
- **WHEN** `RealtimePingModal` is given a `World` with a `realtimePings` entry whose `targetLabel` is `"M. Ferrier"` and a `targetLabel` prop of `"M. Ferrier"`
- **THEN** it SHALL render one bar per entry in that entry's `samples`, with dropped (`null`) samples visually distinct from successful ones

#### Scenario: A dropped sample is excluded from the computed average
- **WHEN** an entry's `samples` includes one or more `null` values
- **THEN** the displayed average RTT SHALL be computed only from the non-null samples, and loss % SHALL reflect the proportion of `null` samples
