## MODIFIED Requirements

### Requirement: A signed-in user holding the right rule can file and revise their own end-of-day report
The system SHALL let a signed-in user holding the `submit_eod_report` rule save a report for a specific calendar date, in either `freeform` mode (`tickets`, `devicesRefurbished`, `packages`, `calls`, `other` free-text fields) or `structured` mode (`ticketRows`, `deviceRows`, `packageRows`, `callRows` arrays of typed rows, plus a free-text `other`). Saving a date that already has a report SHALL replace its fields, not create a second row. The system SHALL enforce at most one report per user per calendar date. A report's mode SHALL be fixed at the time it is first saved and SHALL NOT change on later edits, regardless of the site's current mode setting. A signed-in user who does not hold `submit_eod_report` SHALL be rejected, unless they are a `siteAdmin`.

#### Scenario: Filing a report for a new date creates it
- **WHEN** a signed-in user holding `submit_eod_report` saves a report for a date they have no existing report for
- **THEN** the system SHALL create it in whichever mode is currently set site-wide, with the given field values

#### Scenario: Re-saving an already-filed date replaces its content
- **WHEN** a signed-in user holding `submit_eod_report` saves a report for a date they already have a report for
- **THEN** the system SHALL overwrite that report's fields with the new values in its existing mode, not create a second report for that date, even if the site-wide mode setting has since changed

#### Scenario: Saving the wrong shape for a report's locked-in mode is rejected
- **WHEN** a signed-in user holding `submit_eod_report` submits a structured-mode body for a date whose existing report is in freeform mode, or vice versa
- **THEN** the system SHALL reject the request rather than reinterpret or silently convert it

#### Scenario: A signed-in user without submit_eod_report is rejected
- **WHEN** a signed-in, non-siteAdmin user who does not hold `submit_eod_report` attempts to file or revise a report
- **THEN** the system SHALL reject the request

### Requirement: A signed-in user holding the right rule can list and read their own filed reports
The system SHALL let a signed-in user holding the `view_own_eod_reports` rule list their own filed report dates and retrieve the full content, including its mode, of a specific one. This SHALL only ever operate on the caller's own reports — no self-service route SHALL accept another user's id. A signed-in user who does not hold `view_own_eod_reports` SHALL be rejected, unless they are a `siteAdmin`.

#### Scenario: Listing your own reports returns only your own
- **WHEN** a signed-in user holding `view_own_eod_reports` lists their filed reports
- **THEN** the system SHALL return only reports where the reporting user matches the caller, ordered by date

#### Scenario: Requesting a date with no filed report is a clean miss
- **WHEN** a signed-in user holding `view_own_eod_reports` requests their report for a date they haven't filed one for
- **THEN** the system SHALL respond with a clear not-found result, not an error

#### Scenario: A signed-in user without view_own_eod_reports is rejected
- **WHEN** a signed-in, non-siteAdmin user who does not hold `view_own_eod_reports` attempts to list or read their own reports
- **THEN** the system SHALL reject the request
