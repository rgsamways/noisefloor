## REMOVED Requirements

### Requirement: Cable Degradation's severity badge is unaffected by design
**Reason**: This requirement described the old, RF-based implementation of Cable Degradation (widening `chainImbalanceDb` on the LOCAL column without moving its severity badge). That implementation is being removed because it didn't correspond to how cable degradation actually presents in the field — see the `simulation-engine` delta in this same change.
**Migration**: See the new "Cable Degradation degrades the service-layer LAN port, not the radio link" requirement below, which describes the replacement behavior.

## MODIFIED Requirements

### Requirement: Radio-link fault scenarios apply to the CPE/LOCAL side
For each of Wind Misalignment, Rain Fade, Foliage Growth, and Interference, selecting the scenario SHALL apply that fault to the LOCAL (CPE) radio-link configuration and leave the REMOTE (sector) side healthy.

#### Scenario: Selecting a radio-link fault scenario
- **WHEN** a visitor selects one of the four radio-link fault scenarios
- **THEN** the LOCAL column SHALL reflect that fault's configured effect, and the REMOTE column SHALL remain healthy

### Requirement: Service-layer fault scenarios leave the radio link healthy except Wrong Boot Order
For Expired Lease, Double NAT, Customer Router Offline, and Cable Degradation, selecting the scenario SHALL apply that fault to the service-layer configuration while both LOCAL and REMOTE radio-link readings stay healthy.

#### Scenario: Selecting a service-layer fault scenario
- **WHEN** a visitor selects Expired Lease, Double NAT, Customer Router Offline, or Cable Degradation
- **THEN** the service-layer panel SHALL reflect that fault, and both radio-link columns SHALL remain healthy

## ADDED Requirements

### Requirement: Cable Degradation degrades the service-layer LAN port, not the radio link
Selecting Cable Degradation SHALL reduce the service-layer panel's LAN-port link speed and show a nonzero CRC error count, while leaving the LAN port marked up and leaving both radio-link columns (signal, SNR, chain readings, severity badge) at their healthy values.

#### Scenario: Selecting Cable Degradation
- **WHEN** a visitor selects the Cable Degradation scenario
- **THEN** the service-layer panel's LAN port SHALL show a reduced link speed and a nonzero CRC error count while remaining marked up, and both LOCAL and REMOTE radio-link columns SHALL show no fault-driven degradation
