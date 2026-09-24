# console-scenario-picker Specification

## Purpose

Lets a visitor on `/console` select from a list of named, pre-built fault scenarios and see the radio-link and service-layer panels reflect that scenario live, showcasing the simulation engine's full existing fault catalog instead of one fixed demo state.

## Requirements

### Requirement: A visitor can select from a list of named scenarios
The console SHALL present a control listing every defined scenario by name, and SHALL let a visitor choose one.

#### Scenario: Visitor opens the picker
- **WHEN** a visitor interacts with the scenario control on `/console`
- **THEN** the system SHALL display the full list of defined scenario names, including "Healthy"

### Requirement: Ten scenarios are defined
The system SHALL define exactly these named scenarios, each built from existing fault factories with no new fault behavior: Healthy, Wind Misalignment, Rain Fade, Cable Degradation, Foliage Growth, Interference, Expired Lease, Double NAT, Customer Router Offline, and Wrong Boot Order.

#### Scenario: All ten scenarios are selectable
- **WHEN** a visitor opens the scenario picker
- **THEN** all ten named scenarios SHALL appear as selectable options

### Requirement: Radio-link fault scenarios apply to the CPE/LOCAL side
For Wind Misalignment, Rain Fade, and Foliage Growth, selecting the scenario SHALL apply that fault to both the LOCAL (CPE) and REMOTE (sector) radio-link configurations, matching real-world symmetric degradation. For Interference, selecting the scenario SHALL apply that fault to the LOCAL (CPE) radio-link configuration only, leaving the REMOTE (sector) side healthy, matching interference's real-world one-sided-per-receiver behavior.

#### Scenario: Selecting a radio-link fault scenario
- **WHEN** a visitor selects Wind Misalignment, Rain Fade, or Foliage Growth
- **THEN** both the LOCAL and REMOTE columns SHALL reflect that fault's configured effect

#### Scenario: Selecting Interference
- **WHEN** a visitor selects Interference
- **THEN** the LOCAL column SHALL reflect the fault's configured effect, and the REMOTE column SHALL remain healthy

### Requirement: Service-layer fault scenarios leave the radio link healthy except Wrong Boot Order
For Expired Lease, Double NAT, Customer Router Offline, and Cable Degradation, selecting the scenario SHALL apply that fault to the service-layer configuration while both LOCAL and REMOTE radio-link readings stay healthy.

#### Scenario: Selecting a service-layer fault scenario
- **WHEN** a visitor selects Expired Lease, Double NAT, Customer Router Offline, or Cable Degradation
- **THEN** the service-layer panel SHALL reflect that fault, and both radio-link columns SHALL remain healthy

### Requirement: Wrong Boot Order reproduces its cross-panel signature
Selecting Wrong Boot Order SHALL apply the wrong-boot-order fault to the service-layer configuration AND configure a low uptime on the LOCAL (CPE) radio-link configuration, so the radio link reads healthy while the service layer reads down.

#### Scenario: Selecting Wrong Boot Order
- **WHEN** a visitor selects the Wrong Boot Order scenario
- **THEN** the LOCAL radio-link column SHALL show a low uptime with an otherwise healthy link, and the service-layer panel SHALL reflect the wrong-boot-order fault

### Requirement: Healthy scenario has no active faults
Selecting Healthy SHALL configure LOCAL, REMOTE, and the service layer with no faults applied.

#### Scenario: Selecting Healthy
- **WHEN** a visitor selects Healthy
- **THEN** both radio-link columns and the service-layer panel SHALL show no fault-driven degradation

### Requirement: Cable Degradation degrades the service-layer LAN port, not the radio link
Selecting Cable Degradation SHALL reduce the service-layer panel's LAN-port link speed and show a nonzero CRC error count, while leaving the LAN port marked up and leaving both radio-link columns (signal, SNR, chain readings, severity badge) at their healthy values.

#### Scenario: Selecting Cable Degradation
- **WHEN** a visitor selects the Cable Degradation scenario
- **THEN** the service-layer panel's LAN port SHALL show a reduced link speed and a nonzero CRC error count while remaining marked up, and both LOCAL and REMOTE radio-link columns SHALL show no fault-driven degradation

### Requirement: The scenario picker is scoped to /console only
The homepage's demo panel SHALL NOT display or be affected by the scenario picker; it SHALL continue rendering its own fixed scenario regardless of what has been selected on `/console`.

#### Scenario: Homepage is unaffected
- **WHEN** a visitor changes the scenario selection on `/console`
- **THEN** the homepage's demo panel, on a separate page load, SHALL still show its original fixed scenario, unaffected by any prior `/console` selection
