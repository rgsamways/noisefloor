## ADDED Requirements

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
