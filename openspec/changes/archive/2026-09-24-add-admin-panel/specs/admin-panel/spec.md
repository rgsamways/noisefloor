## Purpose

Defines the siteAdmin-only admin screen and its backing API for managing groups, group memberships, group invitations, and site-wide user permissions — the operational surface on top of `entity-group-permissions`'s data model and enforcement primitives.

## ADDED Requirements

### Requirement: Every admin route and page requires siteAdmin
Every route under `/api/admin` and the `/admin` page SHALL be reachable only by a user with `siteAdmin` true. An unauthenticated request SHALL be rejected as unauthorized, and an authenticated non-siteAdmin request SHALL be rejected as forbidden.

#### Scenario: An unauthenticated request is rejected
- **WHEN** a request with no session reaches any `/api/admin` route
- **THEN** the system SHALL reject it as unauthorized without executing the route's action

#### Scenario: A signed-in, non-siteAdmin request is rejected
- **WHEN** a request from a signed-in user whose `siteAdmin` is false reaches any `/api/admin` route
- **THEN** the system SHALL reject it as forbidden without executing the route's action

#### Scenario: A non-siteAdmin visitor is redirected away from the admin page
- **WHEN** a signed-in user whose `siteAdmin` is false, or an unauthenticated visitor, navigates to `/admin`
- **THEN** the system SHALL NOT render the admin page's content for them

### Requirement: A siteAdmin can list and create groups
The system SHALL let a siteAdmin list every group (with its member count) and create a new group by name, rejecting a duplicate name under the same entity.

#### Scenario: Listing groups includes member counts
- **WHEN** a siteAdmin requests the group list
- **THEN** the system SHALL return every group along with a count of its active memberships

#### Scenario: Creating a group with a new name succeeds
- **WHEN** a siteAdmin creates a group with a name not already used in the entity
- **THEN** the system SHALL create it and return it

#### Scenario: Creating a group with a duplicate name fails cleanly
- **WHEN** a siteAdmin attempts to create a group with a name already used in the entity
- **THEN** the system SHALL reject the request with a clear conflict error, not an unhandled database error

### Requirement: A siteAdmin can view a group's members and pending invitations
The system SHALL let a siteAdmin retrieve a group's memberships (with each member's name, email, tier, rules, and status) and its pending (unaccepted) invitations.

#### Scenario: A group's members are listed with identifying info
- **WHEN** a siteAdmin requests a group's members
- **THEN** the system SHALL return each membership joined with that user's name and email

### Requirement: A siteAdmin can invite an email to a group
The system SHALL let a siteAdmin invite an email address to a group with an optional tier and rule set. If that email already belongs to an existing user, the system SHALL create the membership immediately rather than a pending invitation. Either way, the system SHALL send a notification to that email.

#### Scenario: Inviting an email with no existing account creates a pending invitation
- **WHEN** a siteAdmin invites an email address with no existing user account to a group
- **THEN** the system SHALL create a pending group invitation for that email and send it a notification

#### Scenario: Inviting an email that already has an account grants access immediately
- **WHEN** a siteAdmin invites an email address that already belongs to an existing user to a group
- **THEN** the system SHALL create an active group membership for that user immediately, not a pending invitation, and send them a notification

#### Scenario: Inviting an email already invited or already a member to the same group fails cleanly
- **WHEN** a siteAdmin invites an email to a group where that email already has a pending invitation or an existing membership for that same group
- **THEN** the system SHALL reject the request with a clear conflict error

### Requirement: A siteAdmin can cancel a pending invitation
The system SHALL let a siteAdmin cancel an invitation that has not yet been accepted, and SHALL reject cancelling one that has already been accepted.

#### Scenario: Cancelling a pending invitation removes it
- **WHEN** a siteAdmin cancels an invitation with no `acceptedAt` set
- **THEN** the system SHALL remove it so it can no longer be converted into a membership

#### Scenario: Cancelling an already-accepted invitation fails
- **WHEN** a siteAdmin attempts to cancel an invitation that has already been accepted
- **THEN** the system SHALL reject the request

### Requirement: A siteAdmin can update or revoke a group membership
The system SHALL let a siteAdmin change a membership's tier and/or rules, and separately mark a membership revoked.

#### Scenario: Updating a membership's rules doesn't require changing its tier
- **WHEN** a siteAdmin updates a membership's rules without specifying a tier
- **THEN** the system SHALL leave that membership's tier unchanged

#### Scenario: Revoking a membership marks it revoked, not deleted
- **WHEN** a siteAdmin revokes a membership
- **THEN** the system SHALL set its status to revoked and SHALL NOT delete the row

### Requirement: A siteAdmin can list users and manage site-wide permissions
The system SHALL let a siteAdmin list every user with their `siteAdmin` flag and `siteRules`, and update a specific user's `siteAdmin` flag and/or `siteRules`.

#### Scenario: Listing users includes their site-wide permission state
- **WHEN** a siteAdmin requests the user list
- **THEN** the system SHALL return each user's name, email, `siteAdmin` flag, and `siteRules`

#### Scenario: Granting siteAdmin to another user takes effect
- **WHEN** a siteAdmin sets another user's `siteAdmin` to true
- **THEN** that user SHALL subsequently be treated as siteAdmin by every check that reads it
