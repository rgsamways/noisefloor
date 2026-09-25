## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: A siteAdmin can delete a user account
The system SHALL let a siteAdmin permanently delete another user's account, cascading to their sessions, linked accounts, and group memberships. The system SHALL reject deleting a user's own account. (A separate last-siteAdmin count check is not needed here: the acting siteAdmin is always distinct from the delete target and always survives the deletion, so a delete alone can never reduce the siteAdmin count to zero — see design.md's Decision 1.)

#### Scenario: Deleting a user removes their account and access
- **WHEN** a siteAdmin deletes another user's account
- **THEN** the system SHALL remove that user's row along with their sessions, linked accounts, and group memberships, and that person SHALL no longer be able to sign in or appear in any group's member list

#### Scenario: A siteAdmin cannot delete their own account
- **WHEN** a siteAdmin attempts to delete the account tied to their own current session
- **THEN** the system SHALL reject the request with a clear conflict error and SHALL NOT delete the account
