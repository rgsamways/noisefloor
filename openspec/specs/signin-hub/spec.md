# signin-hub Specification

## Purpose

Gives a signed-in user a real post-sign-in destination that reflects their own access — a hub of the sections their rules actually unlock, rather than the public Landing page every account currently lands on regardless of who they are.

## Requirements

### Requirement: A signed-in user can retrieve their own rule rollup
The system SHALL provide an endpoint that returns the calling signed-in user's own access: the union of `rules` across all of their active group memberships, and their `siteAdmin` flag. This endpoint SHALL only ever return the caller's own access, never another user's.

#### Scenario: A user with active memberships in multiple groups gets the union of their rules
- **WHEN** a signed-in user holding different rules in two different active group memberships requests their own rollup
- **THEN** the system SHALL return the union of both memberships' rules, without duplicates

#### Scenario: A user with a revoked membership does not see that membership's rules
- **WHEN** a signed-in user's only membership in a group is revoked
- **THEN** the system SHALL NOT include that group's rules in the rollup

#### Scenario: An unauthenticated caller is rejected
- **WHEN** a request to this endpoint carries no valid session
- **THEN** the system SHALL reject it as unauthorized

### Requirement: The hub shows exactly three states based on the caller's own access
The system SHALL present a post-sign-in hub whose content depends on the signed-in caller's own access: a caller with no active group memberships and no `siteAdmin` flag SHALL see no operational section, only links to already-public content; a caller holding at least one rule via an active membership SHALL see a card for each section their rules unlock; a caller with `siteAdmin` SHALL see every section's card regardless of their own held rules.

#### Scenario: A caller with no memberships and no siteAdmin sees no operational cards
- **WHEN** a signed-in caller has no active group memberships and `siteAdmin` is false
- **THEN** the hub SHALL show no rule-gated section cards, only links to public content

#### Scenario: A caller holding a relevant rule sees that section's card
- **WHEN** a signed-in caller's rollup includes a rule that a given hub section requires
- **THEN** the hub SHALL show that section's card

#### Scenario: A caller missing a section's required rule does not see that card
- **WHEN** a signed-in caller's rollup does not include any rule a given hub section requires
- **THEN** the hub SHALL NOT show that section's card

#### Scenario: A siteAdmin sees every section regardless of their own rules array
- **WHEN** a signed-in caller has `siteAdmin` true
- **THEN** the hub SHALL show every section's card, even one requiring a rule not present in that caller's own `rules`

### Requirement: Sign-in lands on the hub, not the public Landing page
The system SHALL direct a user to the hub immediately after completing sign-in, rather than to the public Landing page.

#### Scenario: Completing sign-in redirects to the hub
- **WHEN** a user completes the magic-link sign-in flow
- **THEN** the system SHALL land them on the hub
