## Purpose

The `nms/*` dashboard component family (`NOISEFLOOR-OUTLINE.md` §7) — the network-management-system instruments a support tech reads when chasing a throughput incident. Renders entirely from `World`.

## ADDED Requirements

### Requirement: DeviceOverview renders RX and TX throughput over the same hour
`nms/DeviceOverview` SHALL render `World.series.throughputRx1h` and `throughputTx1h` (when set) over the same one-hour window, so RX/TX symmetry is visually comparable.

#### Scenario: DeviceOverview renders both series when both are present
- **WHEN** `DeviceOverview` is given a `World` with both `throughputRx1h` and `throughputTx1h` set
- **THEN** it SHALL render both as traces sharing the same time axis

### Requirement: DeviceManagePane lists device backups
`nms/DeviceManagePane` SHALL render `World.deviceBackups` (when set) as a list of label/timestamp entries.

#### Scenario: DeviceManagePane renders each backup entry
- **WHEN** `DeviceManagePane` is given a `World` with two `deviceBackups` entries
- **THEN** it SHALL render both entries' labels and timestamps

### Requirement: ApStationList renders World.stationList with the current customer highlighted
`nms/ApStationList` SHALL render `World.stationList` as a table (MAC, model, name, signal, remote signal, downlink/uplink capacity, airtime TX/RX, connection time, last IP, throughput RX/TX), visually distinguishing any row with `isCurrentCustomer: true`.

#### Scenario: The current-customer row is visually distinguished
- **WHEN** `ApStationList` is given a `stationList` where one row has `isCurrentCustomer: true`
- **THEN** that row SHALL render with a visual treatment distinct from the other rows
