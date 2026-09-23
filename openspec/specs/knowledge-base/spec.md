# knowledge-base Specification

## Purpose
Defines the content contract for standalone knowledge-base (KB) reference articles — definitions and concepts a fixed-wireless tech needs to read the console — and the public routes that present them, independent of cases or console schema state.

## Requirements

### Requirement: KbArticle records validate against a fixed structure
A `KbArticle` SHALL require `id`, `slug`, `title`, `summary` (a one- or two-sentence definition), and `body` (the full explanation). `slug` SHALL be unique across all articles and URL-safe.

#### Scenario: Article missing a required field fails validation
- **WHEN** a `KbArticle` object is validated that omits `title`, `summary`, or `body`
- **THEN** validation SHALL reject it with an error identifying the missing field

#### Scenario: Two articles share a slug
- **WHEN** the KB content set is validated and two `KbArticle` records share the same `slug`
- **THEN** validation SHALL reject the content set with an error identifying the duplicate slug

#### Scenario: Well-formed article passes validation
- **WHEN** a `KbArticle` object supplies `id`, a unique `slug`, `title`, `summary`, and `body`
- **THEN** validation SHALL accept it and produce a typed `KbArticle` value

### Requirement: KbArticle stands alone, without requiring case or console-schema linkage
A `KbArticle` SHALL NOT require a reference to any `Case`, `Gotcha`, or console-schema field to be valid. A `KbArticle` MAY optionally carry a `relatedFields` list (free-form string identifiers, e.g. a console telemetry field name) for future cross-linking, but omitting it SHALL NOT affect validity.

#### Scenario: An article with no relatedFields still validates
- **WHEN** a `KbArticle` object with no `relatedFields` field is validated
- **THEN** it SHALL be accepted

#### Scenario: An article's relatedFields entries are not required to resolve to anything
- **WHEN** a `KbArticle` sets `relatedFields` to a list of identifiers
- **THEN** validation SHALL accept the article regardless of whether those identifiers correspond to any existing schema, case, or gotcha

### Requirement: The KB index lists published articles without authentication
Requesting the KB index SHALL return every published `KbArticle`'s `slug`, `title`, and `summary`, without requiring sign-in.

#### Scenario: An anonymous visitor loads the KB index
- **WHEN** an unauthenticated visitor requests the KB index
- **THEN** the system SHALL return the list of published articles' slug, title, and summary

### Requirement: A KB article detail view resolves a slug to full content without authentication
Requesting a KB article by its `slug` SHALL return that article's full `body`, without requiring sign-in. Requesting an unknown slug SHALL produce a not-found result, not an error that exposes internal state.

#### Scenario: An anonymous visitor loads a published article
- **WHEN** an unauthenticated visitor requests a KB article by a `slug` that exists
- **THEN** the system SHALL return that article's full content

#### Scenario: A visitor requests a slug that does not exist
- **WHEN** any visitor requests a KB article by a `slug` with no matching `KbArticle`
- **THEN** the system SHALL return a not-found result
