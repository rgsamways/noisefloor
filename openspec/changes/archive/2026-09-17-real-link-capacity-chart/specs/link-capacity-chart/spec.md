## Purpose

The real `crm/LinkCapacityChart` — outline §13's "one component that matters" — renders a case's actual capacity and signal data instead of the placeholder demo numbers the homepage stub used.

## ADDED Requirements

### Requirement: Renders from World data, not fixed numbers
Given a `World` and a seed, the chart SHALL render its capacity bars from `world.series.capacityDown24h`/`usedDown24h` (24h mode) or `capacityDown1y` (1y mode), resolved via `resolveSeriesRef` — not from data hardcoded in the component.

#### Scenario: Changing a World value changes what renders
- **WHEN** a `World`'s `series.capacityDown24h` is changed to different inline points
- **THEN** the chart's rendered bars SHALL reflect the new values, with no code change to the component

#### Scenario: The same World and seed render identically every time
- **WHEN** the chart is rendered twice with the same `World` and seed
- **THEN** the rendered bar heights SHALL be identical both times

### Requirement: A period selector switches between 24h and 1y views
The chart SHALL offer a control switching between a 24h view (stacked used/remaining bars) and a 1y view (a single capacity line, since `World` has no used/remaining split for the yearly series). Only one period's data SHALL be visible at a time.

#### Scenario: Switching period changes what's displayed
- **WHEN** the user switches the chart from 24h to 1y
- **THEN** the stacked used/remaining bars SHALL be replaced by the single 1y capacity line, and the visible time-axis labels SHALL change to match

### Requirement: A signal trace panel accompanies the capacity view
The chart SHALL render a signal trace panel beneath the capacity view, showing `signalTrace24h` in 24h mode or `signalTrace1y` in 1y mode, matching the active period.

#### Scenario: Signal trace panel matches the active period
- **WHEN** the chart is in 1y mode
- **THEN** the signal trace panel SHALL render `signalTrace1y` data, not `signalTrace24h`

### Requirement: An optional package-limit line defaults to the customer's plan rate
The chart SHALL be able to render a horizontal package-limit reference line on the capacity view. When no explicit limit is supplied, it SHALL default to `world.customer.plan.down`.

#### Scenario: Package limit defaults from the World
- **WHEN** the chart is rendered with no explicit package-limit override
- **THEN** the rendered package-limit line SHALL match `world.customer.plan.down`

### Requirement: Annotations render as callouts anchored to specific data points
The chart SHALL accept an optional list of annotations, each identifying a series and a timestamp within it, and render a visible callout with the annotation's label near that specific data point.

#### Scenario: An annotation appears near its target data point
- **WHEN** the chart receives an annotation targeting `{ series: "signalTrace1y", t: "05-24" }` with label "Leaf-out"
- **THEN** a callout containing the text "Leaf-out" SHALL render positioned at or adjacent to the `signalTrace1y` point labelled `"05-24"`
