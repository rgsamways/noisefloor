## Purpose

Lets a customer's real-world identity (name, contact, install site) be linked to their devices across whichever external systems track them (GenieACS, UISP, others later), so a support tech can resolve "this customer" to "these devices" instead of only ever looking up one raw device ID at a time.

## ADDED Requirements

### Requirement: A customer has a name, optional contact info, and one or more sites
The system SHALL let a siteAdmin create a customer record with a name and optional contact fields, and create one or more sites (a physical install location) belonging to that customer.

#### Scenario: Creating a customer with a site
- **WHEN** a siteAdmin creates a customer with a name and at least one site
- **THEN** the system SHALL persist the customer and its site, associated with each other

#### Scenario: A customer can have more than one site
- **WHEN** a siteAdmin adds a second site to an existing customer
- **THEN** the system SHALL persist both sites as belonging to that same customer

### Requirement: A device in an external system can be tagged to a customer's site
The system SHALL let a siteAdmin tag a device — identified by its external system name (`genieacs` or `uisp`) and that system's own device ID — to one of a customer's sites. The system SHALL reject tagging the same external device ID (within the same external system) to more than one site at a time.

#### Scenario: Tagging a GenieACS device to a site
- **WHEN** a siteAdmin tags a GenieACS device ID to a customer's site
- **THEN** the system SHALL persist that device as belonging to that site, resolvable from either direction (site to device, device to site)

#### Scenario: Tagging a UISP device to the same or a different site
- **WHEN** a siteAdmin tags a UISP device ID to a customer's site
- **THEN** the system SHALL persist it independently of any GenieACS tag on the same site — a site can have a tagged device from each system at once

#### Scenario: Re-tagging an already-tagged external device is rejected
- **WHEN** a siteAdmin attempts to tag an external device ID that is already tagged to a different site
- **THEN** the system SHALL reject the request rather than silently moving the tag

### Requirement: An exact-match search resolves a term to a customer
The system SHALL let a caller search by an exact customer name, exact site address, exact GenieACS device ID, or exact UISP device ID, and resolve it to the matching customer record if one exists. Fuzzy or partial matching is explicitly out of scope for this requirement.

#### Scenario: Searching by exact customer name resolves that customer
- **WHEN** a caller searches using a customer's exact name
- **THEN** the system SHALL return that customer's record

#### Scenario: Searching by a tagged device ID resolves the owning customer
- **WHEN** a caller searches using a GenieACS or UISP device ID that is tagged to a site
- **THEN** the system SHALL return the customer that site belongs to

#### Scenario: A search term matching nothing returns a clean no-match result
- **WHEN** a caller searches using a term that matches no customer, site, or tagged device exactly
- **THEN** the system SHALL return a clear no-match result, not an error
