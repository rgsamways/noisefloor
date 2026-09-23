## Purpose

Defines the console's first real screen: a public route rendering a live, correlated-moving radio-link panel driven by `packages/simulation-engine`, in the approved HUD+glow visual direction — the first place any of this pivot's schema/engine/visual-direction work becomes an actual, viewable product.

## ADDED Requirements

### Requirement: The console route is public
Requesting the console route SHALL render the radio-link panel without requiring sign-in or any authenticated session.

#### Scenario: An anonymous visitor loads the console
- **WHEN** an unauthenticated visitor requests the console route
- **THEN** the system SHALL render the radio-link panel, not redirect to sign-in

### Requirement: The panel renders both sides from real simulation output
The console SHALL render a local and a remote radio-link reading, each produced by the simulation engine's `simulateRadioLink` function, not by fixture or hardcoded display values.

#### Scenario: Displayed readings trace back to simulateRadioLink
- **WHEN** the console panel renders a signal, SNR, link-quality, or chain-imbalance value for either side
- **THEN** that value SHALL be the corresponding field from that side's most recent `simulateRadioLink` output

### Requirement: The panel updates on its own without user action
Once loaded, the console panel's readings SHALL change over time on a running interval, without requiring the visitor to reload the page or interact with any control.

#### Scenario: Readings differ between two points after load
- **WHEN** a visitor observes the console panel's readings shortly after load, and again after several seconds have passed with no interaction
- **THEN** at least one displayed reading SHALL have changed between the two observations

### Requirement: The layout is one responsive component, not separate desktop/mobile variants
The console panel SHALL reflow from a side-by-side LOCAL/REMOTE layout to a stacked layout at narrower viewport widths using the same component and markup, not a separately maintained mobile-specific component.

#### Scenario: The same component renders at both a desktop and a mobile viewport width
- **WHEN** the console panel is rendered at a desktop-width viewport and separately at a mobile-width viewport
- **THEN** both SHALL be produced by the same panel component, with only layout (not structure or data source) differing between them
