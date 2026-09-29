## ADDED Requirements

### Requirement: A siteAdmin can view a user's profile

A siteAdmin SHALL be able to view a single user's profile, showing their name, title, email, email-verified state, siteAdmin flag, site rules, and every group membership they hold with its group name, status, tier, and rules. The profile SHALL show a role label for a membership only when that membership's rules exactly equal a role preset's rule set.

#### Scenario: A profile shows user info and group memberships
- **WHEN** a siteAdmin requests a user who belongs to two groups
- **THEN** the response includes the user's name, title, email, verified state, siteAdmin flag, and site rules
- **AND** each membership with its group id and name, status, tier, and rules

#### Scenario: Revoked memberships are included and marked
- **WHEN** the requested user has a revoked membership
- **THEN** it is returned with status revoked

#### Scenario: A user with no memberships shows none
- **WHEN** a siteAdmin requests a user who belongs to no group
- **THEN** the memberships list is empty

#### Scenario: A role label appears only on an exact match
- **WHEN** a membership's rules equal a role preset's rules exactly, in any order
- **THEN** the profile shows that role's name beside the membership
- **AND** for any other rule set the profile shows only the individual rules

#### Scenario: An unknown user fails cleanly
- **WHEN** a siteAdmin requests a user id that does not exist
- **THEN** the request fails with a not-found error

#### Scenario: A non-siteAdmin cannot view a profile
- **WHEN** a signed-in non-siteAdmin or unauthenticated request asks for a profile
- **THEN** the request is rejected

### Requirement: The users list links to each user's profile

The users list SHALL be read-only. Each user's name, title, and email SHALL link to that user's profile, and every edit to a user (name, title, siteAdmin flag, deletion) SHALL be made from the profile.

#### Scenario: Clicking a user opens their profile
- **WHEN** a siteAdmin selects a user's name, title, or email in the list
- **THEN** the profile page for that user opens

#### Scenario: Editing a user happens on the profile
- **WHEN** a siteAdmin edits a user's name or title on the profile and saves
- **THEN** the new values are persisted and shown on the profile and in the list
