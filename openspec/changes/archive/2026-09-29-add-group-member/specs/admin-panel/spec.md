## ADDED Requirements

### Requirement: A siteAdmin can add an existing user directly to a group

A siteAdmin SHALL be able to grant an existing user membership in a group, with optional rules, without creating an invitation and without sending any email. A previously revoked membership for the same user and group SHALL be reactivated rather than duplicated.

#### Scenario: Adding a user who is not a member creates an active membership
- **WHEN** a siteAdmin adds an existing user who has no membership in the group, with a set of rules
- **THEN** that user has an active membership in the group with those rules
- **AND** no email is sent and no invitation row is created

#### Scenario: Adding a user whose membership was revoked reactivates it
- **WHEN** a siteAdmin adds a user whose membership in the group is revoked, with a new set of rules
- **THEN** the same membership becomes active with the new rules, and no second membership exists

#### Scenario: Adding an already-active member fails cleanly
- **WHEN** a siteAdmin adds a user who is already an active member of the group
- **THEN** the request fails with a conflict error and the membership is unchanged

#### Scenario: Adding to an unknown group or an unknown user fails cleanly
- **WHEN** a siteAdmin adds a user to a group that does not exist, or supplies a user id that does not exist
- **THEN** the request fails with a not-found error and nothing is created

#### Scenario: A non-siteAdmin cannot add members
- **WHEN** a signed-in non-siteAdmin or unauthenticated request calls the add-member route
- **THEN** the request is rejected
