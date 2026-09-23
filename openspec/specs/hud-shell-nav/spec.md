# hud-shell-nav Specification

## Purpose
Defines the shared navigation component for noisefloor's public HUD pages (Home, Console, KB) — the "floor" nav from the approved homepage and KB mockups — so those pages can link to each other instead of existing as disconnected islands, without touching the separate, still-light-themed nav used by the auth-gated pages.

## Requirements

### Requirement: The nav highlights the current HUD page
The nav SHALL indicate which of Home, Console, or KB corresponds to the current route, and SHALL NOT indicate more than one as current at the same time.

#### Scenario: The console route is marked current
- **WHEN** the nav is rendered while the current route is `/console`
- **THEN** the Console item SHALL be indicated as current, and Home and KB SHALL NOT be

### Requirement: The nav is one component that reflows, not separate desktop/mobile versions
The nav SHALL render at both desktop and mobile viewport widths from the same component, adapting layout via responsive styling rather than swapping to a different component.

#### Scenario: The same component renders at both viewport widths
- **WHEN** the nav is rendered at a desktop-width viewport and separately at a mobile-width viewport
- **THEN** both SHALL be produced by the same component, with only layout differing between them

### Requirement: The console page includes the nav
Loading the console route SHALL render this nav alongside the existing radio-link panel.

#### Scenario: The console page shows the HUD nav
- **WHEN** a visitor loads `/console`
- **THEN** the page SHALL render both the radio-link panel and the HUD nav with Console indicated as current

### Requirement: The nav does not require its linked routes to exist yet
The nav SHALL render its full set of items (Home, Console, KB) regardless of whether every linked route is implemented yet, and SHALL NOT hide or disable an item merely because its target route doesn't exist at build time.

#### Scenario: A nav item links to a not-yet-implemented route
- **WHEN** the nav renders an item whose target route has no corresponding page yet
- **THEN** the item SHALL still render as a normal link, navigable like any other item
