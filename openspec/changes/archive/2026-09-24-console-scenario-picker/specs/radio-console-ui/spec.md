## MODIFIED Requirements

### Requirement: The panel renders both sides from real simulation output
The console SHALL render a local and a remote radio-link reading, each produced by the simulation engine's `simulateRadioLink` function, not by fixture or hardcoded display values. The configuration passed to `simulateRadioLink` for each side SHALL be determined by whichever named scenario is currently selected via the scenario picker.

#### Scenario: Displayed readings trace back to simulateRadioLink
- **WHEN** the console panel renders a signal, SNR, link-quality, or chain-imbalance value for either side
- **THEN** that value SHALL be the corresponding field from that side's most recent `simulateRadioLink` output for the currently selected scenario

#### Scenario: Readings update after selecting a different scenario
- **WHEN** a visitor selects a different scenario from the picker
- **THEN** the console SHALL re-render both sides' readings using the newly selected scenario's configuration, without a page reload
