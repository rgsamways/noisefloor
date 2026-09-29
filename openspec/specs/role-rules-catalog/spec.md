# role-rules-catalog Specification

## Purpose

Defines the fixed catalog of group-scoped rule keys a group membership's or invitation's `rules` may contain, plus named role templates that bulk-apply a starting set of those rules for convenience — mirroring kerfy's role/rule split, where a role carries no enforcement weight of its own.

## Requirements

### Requirement: Group-scoped rules are drawn from a fixed catalog
The system SHALL define a fixed set of valid group-scoped rule keys, organized into named domains, and SHALL reject any rule key not in that set when creating or updating a group membership's or group invitation's `rules`.

#### Scenario: A valid rule key is accepted
- **WHEN** a group membership or invitation is created or updated with a rule key that exists in the catalog
- **THEN** the system SHALL accept it

#### Scenario: An unknown rule key is rejected
- **WHEN** a group membership or invitation is created or updated with a rule key that does not exist in the catalog
- **THEN** the system SHALL reject the request without persisting any change

### Requirement: A role is a named default-rule template with no enforcement weight
The system SHALL define a fixed set of named roles, each mapping to a default set of catalog rule keys, and SHALL NOT treat a role as itself checked at authorization time — only the rules actually present on a membership are ever enforced.

#### Scenario: Applying a role sets a membership's rules to that role's default set
- **WHEN** an admin applies a role to a group membership or invitation
- **THEN** the system SHALL set that membership's or invitation's `rules` to exactly the applied role's default rule set

#### Scenario: Rules can be hand-edited after a role is applied without reapplying the role
- **WHEN** an admin adds or removes an individual rule on a membership after a role was applied to it
- **THEN** the system SHALL persist the hand-edited rule set, independent of the role's own default set

#### Scenario: Changing a role's default set does not retroactively change existing memberships
- **WHEN** a role's default rule set is changed
- **THEN** the system SHALL NOT modify any group membership or invitation that previously had that role applied

### Requirement: An admin can view and edit a membership's or invitation's rules and apply a role
The system SHALL let an admin view a group membership's or pending invitation's current rules, individually toggle rules, and apply a role as a bulk-set convenience.

#### Scenario: An admin toggles an individual rule on a membership
- **WHEN** an admin adds or removes a single rule on an existing group membership
- **THEN** the system SHALL persist exactly that change without affecting any other rule already present
