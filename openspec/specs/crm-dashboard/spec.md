# crm-dashboard Specification

## Purpose
The `crm/*` dashboard component family (`NOISEFLOOR-OUTLINE.md` §7) beyond `LinkCapacityChart`, which keeps its own dedicated capability. Renders entirely from `World`, same discipline as every other dashboard component.

## Requirements

### Requirement: RealtimePingModal renders a single ping snapshot by target label
`crm/RealtimePingModal` SHALL render the `rttMs`, `lossPct`, and optional `avgRttMs` of the `World.realtimePings` entry matching a given `targetLabel`, using only a `World` and that label as input.

#### Scenario: RealtimePingModal renders the matching snapshot
- **WHEN** `RealtimePingModal` is given a `World` with a `realtimePings` entry whose `targetLabel` is `"M. Ferrier"` and a `targetLabel` prop of `"M. Ferrier"`
- **THEN** it SHALL render that entry's `rttMs` and `lossPct`
