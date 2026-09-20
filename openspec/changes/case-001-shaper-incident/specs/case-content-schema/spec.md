## ADDED Requirements

### Requirement: World supports point-in-time realtime ping snapshots
`World` SHALL support an optional `realtimePings` array, each entry carrying `targetLabel`, `rttMs`, `lossPct`, and an optional `avgRttMs` — for `crm/RealtimePingModal`'s point-in-time reading, distinct from any time-series data.

#### Scenario: A World without realtimePings still validates
- **WHEN** a `World` object with no `realtimePings` field is validated
- **THEN** it SHALL be accepted

#### Scenario: A World with realtimePings set validates
- **WHEN** a `World` object sets `realtimePings` to a well-formed array of snapshots
- **THEN** it SHALL be accepted

### Requirement: World supports a device-backups list
`World` SHALL support an optional `deviceBackups` array, each entry carrying a `label` and `at` timestamp — for `nms/DeviceManagePane`'s backups display.

#### Scenario: A World without deviceBackups still validates
- **WHEN** a `World` object with no `deviceBackups` field is validated
- **THEN** it SHALL be accepted

### Requirement: WorldSeries supports a transmit-side hourly throughput series
`WorldSeries` SHALL support an optional `throughputTx1h` key, parallel to the existing `throughputRx1h`, for displaying RX/TX symmetry (or asymmetry) over the same one-hour window.

#### Scenario: A WorldSeries without throughputTx1h still validates
- **WHEN** a `WorldSeries` object with no `throughputTx1h` field is validated
- **THEN** it SHALL be accepted
