## ADDED Requirements

### Requirement: The chart SHALL support the dashboard-component visual carve-out
`crm/LinkCapacityChart` SHALL be permitted to render its outer card, bars, and line traces with rounded corners, a shadow, and a gradient area-fill beneath line traces, per the dashboard-component visual carve-out in `homepage/DESIGN-NOTES.md`. This is a purely visual allowance — it does not change any of this spec's existing data/behavior requirements.

#### Scenario: Visual styling doesn't affect data correctness
- **WHEN** the chart is rendered with the visual-richness styling applied
- **THEN** all existing data-rendering, period-switching, and annotation requirements in this spec SHALL continue to hold unchanged
