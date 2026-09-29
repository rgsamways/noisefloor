## MODIFIED Requirements

### Requirement: The case list exposes only public metadata, to callers holding access_case_scenarios
`GET /cases` SHALL return each case's `id`, `slug`, `title`, `difficulty`, `estimatedMinutes`, and `tags` — never `world`, `stages`, or `debrief` content. A signed-in, non-siteAdmin caller who does not hold `access_case_scenarios` SHALL be rejected before any case data is returned.

#### Scenario: Case list omits content fields
- **WHEN** a client holding `access_case_scenarios` requests `GET /cases`
- **THEN** the response SHALL NOT include any stage, world, or rubric data for any case

#### Scenario: A caller without access_case_scenarios is rejected
- **WHEN** a signed-in, non-siteAdmin caller who does not hold `access_case_scenarios` requests `GET /cases`
- **THEN** the system SHALL reject the request

### Requirement: A case shell exposes structure, not content, to callers holding access_case_scenarios
`GET /cases/:slug` SHALL return the case's `opening` and an ordered list of stage ids, without any stage's `reveal`, `prompt`, or `rubric` content. A signed-in, non-siteAdmin caller who does not hold `access_case_scenarios` SHALL be rejected.

#### Scenario: Case shell doesn't leak future stages
- **WHEN** a client holding `access_case_scenarios` requests `GET /cases/:slug`
- **THEN** the response SHALL include stage ids in order but SHALL NOT include any stage's evidence, prompt, or rubric

#### Scenario: A caller without access_case_scenarios is rejected
- **WHEN** a signed-in, non-siteAdmin caller who does not hold `access_case_scenarios` requests `GET /cases/:slug`
- **THEN** the system SHALL reject the request

### Requirement: Stage content is gated on holding access_case_scenarios and having committed the prior stage
`GET /cases/:slug/stage/:id` for a given attempt SHALL return that stage's `reveal` and `prompt` (never its `rubric`) only if the caller holds `access_case_scenarios` and the attempt has already committed an answer to the immediately preceding stage. For the first stage, no prior commit is required. A signed-in, non-siteAdmin caller who does not hold `access_case_scenarios` SHALL be rejected regardless of commit history.

#### Scenario: Requesting a stage before committing the prior one is refused
- **WHEN** an attempt held by a caller with `access_case_scenarios` has not yet committed stage 1's answer
- **THEN** `GET /cases/:slug/stage/2` for that attempt SHALL NOT return stage 2's content

#### Scenario: A stage's rubric never appears in its own evidence response
- **WHEN** a client holding `access_case_scenarios` requests any stage's content, at any point in an attempt
- **THEN** the response SHALL NOT include that stage's `rubric`

#### Scenario: A caller without access_case_scenarios is rejected regardless of commit state
- **WHEN** a signed-in, non-siteAdmin caller who does not hold `access_case_scenarios` requests any stage's content
- **THEN** the system SHALL reject the request

### Requirement: Starting an attempt requires access_case_scenarios and records the case version being played
`POST /attempts` SHALL create an attempt tied to the case's current `version`, so a later case revision doesn't retroactively change what an in-progress or completed attempt was scored against. A signed-in, non-siteAdmin caller who does not hold `access_case_scenarios` SHALL be rejected.

#### Scenario: An attempt records its case version at creation
- **WHEN** a caller holding `access_case_scenarios` starts a new attempt for a case
- **THEN** the attempt SHALL store that case's current `version` value

#### Scenario: A caller without access_case_scenarios cannot start an attempt
- **WHEN** a signed-in, non-siteAdmin caller who does not hold `access_case_scenarios` requests `POST /attempts`
- **THEN** the system SHALL reject the request

### Requirement: Committing a stage requires access_case_scenarios and is a one-time action per stage
`POST /attempts/:id/commit` SHALL accept a stage id and answer, score it, persist the commit, and return the score, feedback, and either the next stage's id or a debrief-unlocked signal, only for a caller holding `access_case_scenarios`. Committing the same stage twice for the same attempt SHALL be rejected — the first commit stands.

#### Scenario: A commit returns feedback and the next stage
- **WHEN** a caller holding `access_case_scenarios` commits a valid answer for a non-final stage
- **THEN** the response SHALL include a score, feedback text, and the next stage's id

#### Scenario: The final stage's commit unlocks the debrief instead of a next stage
- **WHEN** a caller holding `access_case_scenarios` commits a valid answer for the last stage in the case
- **THEN** the response SHALL signal the debrief is unlocked, with no next stage id

#### Scenario: Re-committing an already-committed stage is rejected
- **WHEN** a second commit is submitted for a stage the attempt already has a commit for
- **THEN** the request SHALL be rejected and the original commit SHALL remain unchanged

#### Scenario: A caller without access_case_scenarios cannot commit
- **WHEN** a signed-in, non-siteAdmin caller who does not hold `access_case_scenarios` requests `POST /attempts/:id/commit`
- **THEN** the system SHALL reject the request
