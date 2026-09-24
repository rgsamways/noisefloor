## MODIFIED Requirements

### Requirement: KbArticle records validate against a fixed structure
A `KbArticle` SHALL require `id`, `slug`, `title`, `summary` (a one- or two-sentence definition), `technicalExplanation` (the full technical explanation), `laymanExplanation` (the full plain-language explanation), and `category` (one of a fixed set of topic groupings). `slug` SHALL be unique across all articles and URL-safe. `category` SHALL be one of the fixed enum values; any other value SHALL fail validation.

#### Scenario: Article missing a required field fails validation
- **WHEN** a `KbArticle` object is validated that omits `title`, `summary`, `technicalExplanation`, `laymanExplanation`, or `category`
- **THEN** validation SHALL reject it with an error identifying the missing field

#### Scenario: Two articles share a slug
- **WHEN** the KB content set is validated and two `KbArticle` records share the same `slug`
- **THEN** validation SHALL reject the content set with an error identifying the duplicate slug

#### Scenario: Well-formed article passes validation
- **WHEN** a `KbArticle` object supplies `id`, a unique `slug`, `title`, `summary`, `technicalExplanation`, `laymanExplanation`, and a valid `category`
- **THEN** validation SHALL accept it and produce a typed `KbArticle` value

#### Scenario: An unrecognized category value fails validation
- **WHEN** a `KbArticle` object is validated whose `category` value is not one of the fixed set of allowed categories
- **THEN** validation SHALL reject it with an error identifying the invalid category

### Requirement: KbArticle stands alone, without requiring case or console-schema linkage
A `KbArticle` SHALL NOT require a reference to any `Case` or `Gotcha` to be valid. A `KbArticle` MAY optionally carry a `relatedFields` list; when present, every entry SHALL be a field path that resolves to a real field in `RadioLinkTelemetry` or `ServiceLayerTelemetry` (from `@noisefloor/console-schema`), and validation SHALL reject an entry that does not resolve. Omitting `relatedFields` entirely SHALL NOT affect validity.

#### Scenario: An article with no relatedFields still validates
- **WHEN** a `KbArticle` object with no `relatedFields` field is validated
- **THEN** it SHALL be accepted

#### Scenario: An article's relatedFields entries are not required to resolve to anything
- **WHEN** a `KbArticle` sets `relatedFields` to a list of dotted console-schema field paths
- **THEN** validation SHALL accept the article without also requiring those paths to reference any `Case` or `Gotcha` — the only resolvability check is against real `RadioLinkTelemetry`/`ServiceLayerTelemetry` fields, per the next scenario

#### Scenario: relatedFields entries that resolve to a real console-schema field pass validation
- **WHEN** a `KbArticle` sets `relatedFields` to a list of field paths that each correspond to a real field in `RadioLinkTelemetry` or `ServiceLayerTelemetry`
- **THEN** validation SHALL accept the article

#### Scenario: An unresolvable relatedFields entry fails validation
- **WHEN** a `KbArticle` sets `relatedFields` to a list containing at least one field path that does not correspond to any real field in `RadioLinkTelemetry` or `ServiceLayerTelemetry`
- **THEN** validation SHALL reject the article with an error identifying the unresolvable entry

### Requirement: The KB index lists published articles without authentication
Requesting the KB index SHALL return every published `KbArticle`'s `slug`, `title`, `summary`, and `category`, without requiring sign-in.

#### Scenario: An anonymous visitor loads the KB index
- **WHEN** an unauthenticated visitor requests the KB index
- **THEN** the system SHALL return the list of published articles' slug, title, summary, and category

### Requirement: A KB article detail view resolves a slug to full content without authentication
Requesting a KB article by its `slug` SHALL return that article's full `technicalExplanation` and `laymanExplanation`, without requiring sign-in. Requesting an unknown slug SHALL produce a not-found result, not an error that exposes internal state.

#### Scenario: An anonymous visitor loads a published article
- **WHEN** an unauthenticated visitor requests a KB article by a `slug` that exists
- **THEN** the system SHALL return that article's full `technicalExplanation` and `laymanExplanation`

#### Scenario: A visitor requests a slug that does not exist
- **WHEN** any visitor requests a KB article by a `slug` with no matching `KbArticle`
- **THEN** the system SHALL return a not-found result

## ADDED Requirements

### Requirement: KbArticle's optional icon must be a real Lucide icon name
A `KbArticle` MAY optionally carry an `icon` field naming a Lucide icon. When present, validation SHALL reject an `icon` value that does not correspond to an actual exported icon in the `lucide-react` package. Omitting `icon` SHALL NOT affect validity.

#### Scenario: An article with no icon still validates
- **WHEN** a `KbArticle` object with no `icon` field is validated
- **THEN** it SHALL be accepted

#### Scenario: A valid Lucide icon name passes validation
- **WHEN** a `KbArticle` sets `icon` to a name that corresponds to a real exported icon in `lucide-react`
- **THEN** validation SHALL accept the article

#### Scenario: An unrecognized icon name fails validation
- **WHEN** a `KbArticle` sets `icon` to a name that does not correspond to any exported icon in `lucide-react`
- **THEN** validation SHALL reject the article with an error identifying the invalid icon name

### Requirement: The KB index supports searching articles by name, summary, and alias
The KB index SHALL let a visitor filter the displayed article list by a free-text query, matching against each article's `title`, `summary`, and `aliases` (when present), without requiring sign-in or a page reload.

#### Scenario: A search query matching an article's title returns that article
- **WHEN** a visitor enters a query on the KB index that matches an article's `title`
- **THEN** the displayed list SHALL include that article

#### Scenario: A search query matching an alias returns that article
- **WHEN** a visitor enters a query on the KB index that matches one of an article's `aliases` but not its `title` or `summary`
- **THEN** the displayed list SHALL include that article

#### Scenario: A search query matching nothing returns an empty result
- **WHEN** a visitor enters a query on the KB index that matches no article's `title`, `summary`, or `aliases`
- **THEN** the displayed list SHALL be empty

### Requirement: The KB index groups articles by category
The KB index SHALL let a visitor view articles grouped or filtered by `category`, without requiring sign-in.

#### Scenario: A visitor filters the KB index to one category
- **WHEN** a visitor selects a single `category` on the KB index
- **THEN** the displayed list SHALL include only articles whose `category` matches the selection
