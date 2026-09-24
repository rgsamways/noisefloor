## MODIFIED Requirements

### Requirement: Radio-link fault scenarios apply to the CPE/LOCAL side
For Wind Misalignment, Rain Fade, and Foliage Growth, selecting the scenario SHALL apply that fault to both the LOCAL (CPE) and REMOTE (sector) radio-link configurations, matching real-world symmetric degradation. For Interference, selecting the scenario SHALL apply that fault to the LOCAL (CPE) radio-link configuration only, leaving the REMOTE (sector) side healthy, matching interference's real-world one-sided-per-receiver behavior.

#### Scenario: Selecting a radio-link fault scenario
- **WHEN** a visitor selects Wind Misalignment, Rain Fade, or Foliage Growth
- **THEN** both the LOCAL and REMOTE columns SHALL reflect that fault's configured effect

#### Scenario: Selecting Interference
- **WHEN** a visitor selects Interference
- **THEN** the LOCAL column SHALL reflect the fault's configured effect, and the REMOTE column SHALL remain healthy
