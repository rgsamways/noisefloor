# magic-link-auth Specification

## Purpose
Passwordless sign-in for noisefloor.ca: a trainee enters their email, receives a link, and clicking it establishes a session — no password to set, reset, or leak.

## Requirements

### Requirement: A user can request a sign-in link by email
The system SHALL accept an email address at the sign-in page and, when valid, issue a single-use magic link tied to that email, expiring after 30 minutes.

#### Scenario: Requesting a link for a new or existing email
- **WHEN** a user submits their email on the sign-in page
- **THEN** the system SHALL send (or, in local dev with no email provider configured, log) a magic link for that email

### Requirement: Clicking a valid link establishes a session
The system SHALL exchange a valid, unexpired, unused magic link for a session, redirecting the user into the authenticated app.

#### Scenario: First-time sign-in creates an account
- **WHEN** a user clicks a valid magic link for an email with no existing account
- **THEN** the system SHALL create a user record and an authenticated session for it

#### Scenario: Returning user reuses their account
- **WHEN** a user clicks a valid magic link for an email with an existing account
- **THEN** the system SHALL authenticate as that existing user, not create a duplicate

### Requirement: Expired or already-used links are rejected
The system SHALL refuse to establish a session from a magic link that has expired or been used once already, and SHALL surface this state so the user can request a new link.

#### Scenario: Reusing a consumed link
- **WHEN** a magic link that has already been used to sign in is clicked again
- **THEN** the system SHALL reject it without creating a session

### Requirement: The session cookie is usable across the web and API subdomains
When served from `noisefloor.ca` and `api.noisefloor.ca`, the authenticated session SHALL be readable by both, so a signed-in user's requests from the web app to the API are recognized as authenticated.

#### Scenario: An authenticated web request reaches the API as authenticated
- **WHEN** a signed-in user's browser calls the API at `api.noisefloor.ca`
- **THEN** the API SHALL recognize the request's session cookie as belonging to that authenticated user
