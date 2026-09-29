# admin-panel Specification

## Purpose
Defines the siteAdmin-only admin screen and its backing API for managing groups, group memberships, group invitations, and site-wide user permissions — the operational surface on top of `entity-group-permissions`'s data model and enforcement primitives.

## Requirements

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
The system SHALL let a siteAdmin list every user with their `name`, `title`, `siteAdmin` flag, and `siteRules`, and update a specific user's `name`, `title`, `siteAdmin` flag, and/or `siteRules`. The system SHALL reject an update that would set `siteAdmin` to false on the last remaining siteAdmin user.

#### Scenario: Listing users includes their site-wide permission state
- **WHEN** a siteAdmin requests the user list
- **THEN** the system SHALL return each user's name, title, email, `siteAdmin` flag, and `siteRules`

#### Scenario: Granting siteAdmin to another user takes effect
- **WHEN** a siteAdmin sets another user's `siteAdmin` to true
- **THEN** that user SHALL subsequently be treated as siteAdmin by every check that reads it

#### Scenario: A siteAdmin can update a user's name and title
- **WHEN** a siteAdmin updates a user's `name` and/or `title`
- **THEN** the system SHALL persist the new values and return them

#### Scenario: Removing siteAdmin from the last siteAdmin fails cleanly
- **WHEN** a siteAdmin attempts to set `siteAdmin` to false on the only user who currently has `siteAdmin` true
- **THEN** the system SHALL reject the request with a clear conflict error and SHALL NOT change that user's `siteAdmin` value

### Requirement: A siteAdmin can delete a user account
The system SHALL let a siteAdmin permanently delete another user's account, cascading to their sessions, linked accounts, and group memberships. The system SHALL reject deleting a user's own account. (A separate last-siteAdmin count check is not needed here: the acting siteAdmin is always distinct from the delete target and always survives the deletion, so a delete alone can never reduce the siteAdmin count to zero — see design.md's Decision 1.)

#### Scenario: Deleting a user removes their account and access
- **WHEN** a siteAdmin deletes another user's account
- **THEN** the system SHALL remove that user's row along with their sessions, linked accounts, and group memberships, and that person SHALL no longer be able to sign in or appear in any group's member list

#### Scenario: A siteAdmin cannot delete their own account
- **WHEN** a siteAdmin attempts to delete the account tied to their own current session
- **THEN** the system SHALL reject the request with a clear conflict error and SHALL NOT delete the account

### Requirement: A siteAdmin can create a user account directly

A siteAdmin SHALL be able to create a user account from an email, a name, and an optional title, without sending any email and without creating an invitation. The account SHALL be usable through the normal magic-link sign-in flow. Creation SHALL NOT set a password.

#### Scenario: Creating a user with a new email succeeds
- **WHEN** a siteAdmin submits a valid email, a name, and an optional title for an email with no existing account
- **THEN** a user account exists with that email, name, and title, unverified, without siteAdmin or site rules
- **AND** no email is sent and no invitation row is created

#### Scenario: Creating a user with an existing email fails cleanly
- **WHEN** a siteAdmin submits an email that already has an account, in any letter case
- **THEN** the request fails with a conflict error and no second account is created

#### Scenario: A created user signs in through magic link
- **WHEN** a created user requests and follows a sign-in link for their email
- **THEN** they are signed in to the pre-created account rather than a new one

#### Scenario: Creating a user with an initial group grants membership immediately
- **WHEN** a siteAdmin creates a user and supplies a group with optional tier and rules
- **THEN** the user has an active membership in that group with those tier and rules

#### Scenario: A non-siteAdmin cannot create users
- **WHEN** a signed-in non-siteAdmin or unauthenticated request calls the create-user route
- **THEN** the request is rejected

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
