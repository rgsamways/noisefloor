## Purpose

The public entry point to noisefloor — a stranger can land on `/`, understand what the site is, and reach the demo without signing in, per `NOISEFLOOR-OUTLINE.md` §8 and §15's definition of v1 done.

## ADDED Requirements

### Requirement: The landing page is reachable without authentication
`/` SHALL render the public landing page for any visitor, signed in or not. It SHALL NOT redirect an unauthenticated visitor to the sign-in page.

#### Scenario: An anonymous visitor loads the site
- **WHEN** a visitor with no session loads `/`
- **THEN** the landing page renders directly, with no redirect to `/sign-in`

### Requirement: The landing page states what the site is and offers a path in
The landing page SHALL present a headline, supporting copy, and a primary call-to-action linking toward playing a case, alongside a sign-in link for returning users.

#### Scenario: A visitor can find both the demo and sign-in
- **WHEN** the landing page renders
- **THEN** it SHALL contain a primary call-to-action element pointing at the case-playing experience, and a separate sign-in link

### Requirement: Site navigation is persistent, real, and reflects the current page
Every page SHALL render a bottom navigation bar with Home, Cases, Gotchas, and Me destinations, implemented as real navigable elements (not decorative divs). The item matching the current route SHALL be marked as current for assistive technology.

#### Scenario: The active nav item is marked for assistive technology
- **WHEN** the landing page (`/`) renders
- **THEN** the Home navigation item SHALL carry `aria-current="page"` and the other items SHALL NOT

#### Scenario: Navigation items are keyboard-reachable links
- **WHEN** a user tabs through the bottom navigation
- **THEN** each item SHALL be a focusable link element with an accessible name, not a `<div>` with a click handler

### Requirement: The homepage's hero chart is a rendered component, not a static image
The hero section SHALL render its capacity chart as a live UI component rather than an `<img>` or background image, even where the component's underlying data is a fixed placeholder rather than real case content.

#### Scenario: The hero chart is inspectable as markup, not an image asset
- **WHEN** the landing page renders
- **THEN** the hero chart area SHALL be composed of DOM elements reflecting its data (e.g. one element per data bar), not a single image element
