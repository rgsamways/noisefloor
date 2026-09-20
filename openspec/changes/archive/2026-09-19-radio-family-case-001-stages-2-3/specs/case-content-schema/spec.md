## ADDED Requirements

### Requirement: Device carries optional cosmetic radio-header fields
`Device` (the `cpe`/`ap` shape within `World`) SHALL support optional `mac`, `txPowerDbm`, and `lanSpeedMbps` fields for display in `radio/LinkHeader` and `radio/DeviceDetails`. None of the three SHALL be required, and none SHALL participate in any `world-consistency-validator` rule.

#### Scenario: A pre-existing Device without the new fields still validates
- **WHEN** a `Device` object with no `mac`, `txPowerDbm`, or `lanSpeedMbps` field is validated
- **THEN** it SHALL be accepted

#### Scenario: A Device with the new fields set still validates
- **WHEN** a `Device` object sets `mac`, `txPowerDbm`, and `lanSpeedMbps` to well-typed values
- **THEN** it SHALL be accepted
