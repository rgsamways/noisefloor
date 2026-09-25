## MODIFIED Requirements

### Requirement: A signed-in user can file and revise their own end-of-day report
The system SHALL let a signed-in user save a report for a specific calendar date, in either `freeform` mode (`tickets`, `devicesRefurbished`, `packages`, `calls`, `other` free-text fields) or `structured` mode (`ticketRows`, `deviceRows`, `packageRows`, `callRows` arrays of typed rows, plus a free-text `other`). Saving a date that already has a report SHALL replace its fields, not create a second row. The system SHALL enforce at most one report per user per calendar date. A report's mode SHALL be fixed at the time it is first saved and SHALL NOT change on later edits, regardless of the site's current mode setting.

#### Scenario: Filing a report for a new date creates it
- **WHEN** a signed-in user saves a report for a date they have no existing report for
- **THEN** the system SHALL create it in whichever mode is currently set site-wide, with the given field values

#### Scenario: Re-saving an already-filed date replaces its content
- **WHEN** a signed-in user saves a report for a date they already have a report for
- **THEN** the system SHALL overwrite that report's fields with the new values in its existing mode, not create a second report for that date, even if the site-wide mode setting has since changed

#### Scenario: Saving the wrong shape for a report's locked-in mode is rejected
- **WHEN** a signed-in user submits a structured-mode body for a date whose existing report is in freeform mode, or vice versa
- **THEN** the system SHALL reject the request rather than reinterpret or silently convert it

### Requirement: A signed-in user can list and read their own filed reports
The system SHALL let a signed-in user list their own filed report dates and retrieve the full content, including its mode, of a specific one. This SHALL only ever operate on the caller's own reports — no self-service route SHALL accept another user's id.

#### Scenario: Listing your own reports returns only your own
- **WHEN** a signed-in user lists their filed reports
- **THEN** the system SHALL return only reports where the reporting user matches the caller, ordered by date

#### Scenario: Requesting a date with no filed report is a clean miss
- **WHEN** a signed-in user requests their report for a date they haven't filed one for
- **THEN** the system SHALL respond with a clear not-found result, not an error

### Requirement: A siteAdmin can read another user's filed reports
The system SHALL let a siteAdmin list the filed reports belonging to any other user, including each report's mode. A non-siteAdmin SHALL NOT be able to read another user's reports through any route.

#### Scenario: A siteAdmin can list a specific user's reports
- **WHEN** a siteAdmin requests the filed reports for a given user id
- **THEN** the system SHALL return that user's reports, each with its own mode

#### Scenario: A non-siteAdmin cannot read another user's reports
- **WHEN** a signed-in, non-siteAdmin user attempts to read another user's filed reports
- **THEN** the system SHALL reject the request as forbidden

### Requirement: A filed report survives its author's account being deleted
The system SHALL NOT delete a user's filed reports as a consequence of that user's account being deleted, and SHALL retain a snapshot of the reporting user's email on each report at the time it was filed.

#### Scenario: Deleting a user's account leaves their filed reports intact
- **WHEN** a siteAdmin deletes a user's account who has previously filed end-of-day reports
- **THEN** the system SHALL NOT delete those reports, and each SHALL still show the email of the user who filed it

## ADDED Requirements

### Requirement: A siteAdmin can set the site-wide end-of-day report mode
The system SHALL let a siteAdmin read and set a single site-wide end-of-day report mode (`freeform` or `structured`), defaulting to `freeform`. Any signed-in user SHALL be able to read the current mode. A non-siteAdmin SHALL NOT be able to change it.

#### Scenario: A siteAdmin can switch the site-wide mode
- **WHEN** a siteAdmin sets the end-of-day report mode to `structured`
- **THEN** the system SHALL persist it, and every new report filed afterward for a date with no existing report SHALL default to `structured`

#### Scenario: A non-siteAdmin cannot change the mode
- **WHEN** a signed-in, non-siteAdmin user attempts to set the end-of-day report mode
- **THEN** the system SHALL reject the request as forbidden

#### Scenario: Any signed-in user can read the current mode
- **WHEN** a signed-in user requests the current end-of-day report mode
- **THEN** the system SHALL return it, regardless of that user's own permissions
