# entity-group-permissions Specification

## Purpose
Defines the data model and enforcement primitives for organizational access at noisefloor: named entities containing named groups, individually-tunable per-membership permissions, a global superadmin bypass, and site-wide permission grants independent of any entity or group. This capability provides the model only — no admin UI, invite-sending UI, or differentiated sign-in experience; those are separate capabilities built on top of it.

## Requirements

### Requirement: A siteAdmin user bypasses every permission check
A user with `siteAdmin` true SHALL be treated as authorized for every site-wide rule check and every group-scoped rule check, regardless of whether they hold that rule or belong to that group.

#### Scenario: A siteAdmin user passes a site-wide rule check they don't explicitly hold
- **WHEN** a user with `siteAdmin` true is checked against a site-wide rule not present in their `siteRules`
- **THEN** the check SHALL pass

#### Scenario: A siteAdmin user passes a group rule check without a membership
- **WHEN** a user with `siteAdmin` true is checked against a group rule for a group they have no membership row in
- **THEN** the check SHALL pass

### Requirement: A non-superadmin user's site-wide access is exactly their siteRules
A user with `siteAdmin` false SHALL be authorized for a site-wide rule check if and only if that rule is present in their `siteRules`.

#### Scenario: A held site-wide rule passes
- **WHEN** a non-superadmin user is checked against a site-wide rule present in their `siteRules`
- **THEN** the check SHALL pass

#### Scenario: An unheld site-wide rule fails
- **WHEN** a non-superadmin user is checked against a site-wide rule not present in their `siteRules`
- **THEN** the check SHALL fail

### Requirement: Entities are named top-level organizational containers
The system SHALL support creating an `entity` with a name, independent of any group or user.

#### Scenario: An entity can be created with just a name
- **WHEN** an entity is created with a name
- **THEN** the system SHALL persist it and allow groups to reference it

### Requirement: Groups belong to exactly one entity and have unique names within it
The system SHALL require every `group` to reference exactly one `entity`, and SHALL reject creating two groups with the same name under the same entity.

#### Scenario: A group is created under an entity
- **WHEN** a group is created referencing an existing entity
- **THEN** the system SHALL persist it as belonging to that entity

#### Scenario: A duplicate group name under the same entity is rejected
- **WHEN** a group is created with a name that already exists under the same entity
- **THEN** the system SHALL reject the creation

#### Scenario: The same group name is allowed under a different entity
- **WHEN** a group is created with a name that already exists under a different entity
- **THEN** the system SHALL accept the creation

### Requirement: A group membership grants an individually-tunable rule set, optionally at a tier
The system SHALL support a `groupMembership` linking one user to one group, carrying an independently-editable `rules` set and an optional `tier` value, with at most one membership per user per group.

#### Scenario: A membership can be created with a tier and a rule set
- **WHEN** a group membership is created for a user and group with a tier and a set of rules
- **THEN** the system SHALL persist all three together on that membership

#### Scenario: A membership's rules can change without changing its tier
- **WHEN** an existing membership's rules are updated
- **THEN** the membership's `tier` SHALL remain unchanged unless also explicitly updated

#### Scenario: A second membership for the same user and group is rejected
- **WHEN** a group membership is created for a user and group that already have an active or revoked membership row
- **THEN** the system SHALL reject the creation

### Requirement: Group membership status preserves history instead of deleting
The system SHALL support marking a `groupMembership` as `revoked` rather than deleting it, and SHALL exclude revoked memberships from active-access checks.

#### Scenario: A revoked membership fails a group rule check
- **WHEN** a user's only membership in a group is `revoked` and is checked against a rule that membership's `rules` includes
- **THEN** the check SHALL fail

#### Scenario: A revoked membership's row still exists
- **WHEN** a membership is revoked
- **THEN** its row SHALL remain queryable, not deleted

### Requirement: A group invitation converts into a real membership when its email signs in
The system SHALL support inviting an email address to a group with a tier and rule set before that email has ever signed in, and SHALL convert an unaccepted invitation into a real `groupMembership` (with the invitation's tier and rules) the moment a user with that email resolves a session, marking the invitation accepted.

#### Scenario: Signing in with an invited email creates the membership
- **WHEN** a user whose email has an unaccepted group invitation resolves a session for the first time
- **THEN** the system SHALL create a matching `groupMembership` with the invitation's tier and rules, and mark the invitation accepted

#### Scenario: An already-accepted invitation is not reapplied
- **WHEN** a user whose email has an already-accepted invitation for a group resolves a subsequent session
- **THEN** the system SHALL NOT create a duplicate membership or modify the existing one

#### Scenario: Invitation email matching is case-insensitive
- **WHEN** an invitation was created for an email in one case and a user signs in with the same email in a different case
- **THEN** the system SHALL still convert the invitation

### Requirement: A configured bootstrap email is granted siteAdmin on session resolution
The system SHALL designate exactly one configured email address as the initial superadmin, and SHALL set `siteAdmin` true for that user the next time they resolve a session, if it is not already true — regardless of whether their account existed before or after this capability was deployed.

#### Scenario: The bootstrap email signs in after the capability is deployed
- **WHEN** a user with the configured bootstrap email resolves a session for the first time after this capability exists
- **THEN** their `siteAdmin` SHALL be set true as part of that resolution

#### Scenario: The bootstrap email already existed before this capability was deployed
- **WHEN** a user with the configured bootstrap email who already had an account resolves a session
- **THEN** their `siteAdmin` SHALL be set true, without requiring a new account to be created

#### Scenario: A non-bootstrap email is never granted siteAdmin by this mechanism
- **WHEN** a user with an email other than the configured bootstrap address resolves a session
- **THEN** their `siteAdmin` SHALL NOT be changed by this mechanism
