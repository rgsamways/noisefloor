## MODIFIED Requirements

### Requirement: A group membership grants an individually-tunable rule set, optionally at a tier
The system SHALL support a `groupMembership` linking one user to one group, carrying an independently-editable `rules` set drawn from the defined rule-key catalog and an optional `tier` value, with at most one membership per user per group.

#### Scenario: A membership can be created with a tier and a rule set
- **WHEN** a group membership is created for a user and group with a tier and a set of rules
- **THEN** the system SHALL persist all three together on that membership

#### Scenario: A membership's rules can change without changing its tier
- **WHEN** an existing membership's rules are updated
- **THEN** the membership's `tier` SHALL remain unchanged unless also explicitly updated

#### Scenario: A second membership for the same user and group is rejected
- **WHEN** a group membership is created for a user and group that already have an active or revoked membership row
- **THEN** the system SHALL reject the creation

#### Scenario: A rule key outside the catalog is rejected
- **WHEN** a group membership is created or updated with a rule key that does not exist in the defined rule-key catalog
- **THEN** the system SHALL reject the request without persisting any change
