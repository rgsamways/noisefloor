## MODIFIED Requirements

### Requirement: The landing page states what the site is and offers a path in
The landing page SHALL present a headline, supporting copy, and a primary call-to-action linking toward the console, alongside a sign-in link for returning users.

#### Scenario: A visitor can find both the demo and sign-in
- **WHEN** the landing page renders
- **THEN** it SHALL contain a primary call-to-action element pointing at the console, and a separate sign-in link

### Requirement: Site navigation is persistent, real, and reflects the current page
The landing page SHALL render a persistent navigation element with real, focusable link elements (not decorative `<div>`s with click handlers), and the item corresponding to the current route SHALL be marked as current for assistive technology. The specific set of destinations is defined by whichever navigation component the page uses, not fixed by this requirement.

#### Scenario: The active nav item is marked for assistive technology
- **WHEN** the landing page (`/`) renders
- **THEN** the Home navigation item SHALL carry `aria-current="page"` and the other items SHALL NOT

#### Scenario: Navigation items are keyboard-reachable links
- **WHEN** a user tabs through the bottom navigation
- **THEN** each item SHALL be a focusable link element with an accessible name, not a `<div>` with a click handler

### Requirement: The homepage's hero chart is a rendered component, not a static image
The hero section SHALL render its instrument-panel visual as a live UI component reflecting real simulated data, rather than an `<img>`, background image, or a component fed by parked case-study content.

#### Scenario: The hero chart is inspectable as markup, not an image asset
- **WHEN** the landing page renders
- **THEN** the hero visual area SHALL be composed of DOM elements reflecting its data (e.g. one element per data bar), not a single image element

#### Scenario: The hero visual is driven by the simulation engine, not parked content
- **WHEN** the landing page's hero visual renders
- **THEN** its displayed values SHALL originate from `simulateRadioLink`, not from `packages/shared`'s parked gallery/case-study data
