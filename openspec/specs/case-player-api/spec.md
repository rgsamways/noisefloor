# case-player-api Specification

## Purpose
The server-side guarantee that makes "commit before reveal" real rather than cosmetic: a client can't peek ahead at future evidence or rubrics no matter what it does in the browser, because the server never sends them until they're earned.

## Requirements

### Requirement: The case list exposes only public metadata
`GET /cases` SHALL return each case's `id`, `slug`, `title`, `difficulty`, `estimatedMinutes`, and `tags` — never `world`, `stages`, or `debrief` content.

#### Scenario: Case list omits content fields
- **WHEN** a client requests `GET /cases`
- **THEN** the response SHALL NOT include any stage, world, or rubric data for any case

### Requirement: A case shell exposes structure, not content
`GET /cases/:slug` SHALL return the case's `opening` and an ordered list of stage ids, without any stage's `reveal`, `prompt`, or `rubric` content.

#### Scenario: Case shell doesn't leak future stages
- **WHEN** a client requests `GET /cases/:slug`
- **THEN** the response SHALL include stage ids in order but SHALL NOT include any stage's evidence, prompt, or rubric

### Requirement: Stage content is gated on having committed the prior stage
`GET /cases/:slug/stage/:id` for a given attempt SHALL return that stage's `reveal` and `prompt` (never its `rubric`) only if the attempt has already committed an answer to the immediately preceding stage. For the first stage, no prior commit is required.

#### Scenario: Requesting a stage before committing the prior one is refused
- **WHEN** an attempt has not yet committed stage 1's answer
- **THEN** `GET /cases/:slug/stage/2` for that attempt SHALL NOT return stage 2's content

#### Scenario: A stage's rubric never appears in its own evidence response
- **WHEN** a client requests any stage's content, at any point in an attempt
- **THEN** the response SHALL NOT include that stage's `rubric`

### Requirement: Starting an attempt records the case version being played
`POST /attempts` SHALL create an attempt tied to the case's current `version`, so a later case revision doesn't retroactively change what an in-progress or completed attempt was scored against.

#### Scenario: An attempt records its case version at creation
- **WHEN** a new attempt is started for a case
- **THEN** the attempt SHALL store that case's current `version` value

### Requirement: Committing a stage is a one-time action per stage
`POST /attempts/:id/commit` SHALL accept a stage id and answer, score it, persist the commit, and return the score, feedback, and either the next stage's id or a debrief-unlocked signal. Committing the same stage twice for the same attempt SHALL be rejected — the first commit stands.

#### Scenario: A commit returns feedback and the next stage
- **WHEN** a valid answer is committed for a non-final stage
- **THEN** the response SHALL include a score, feedback text, and the next stage's id

#### Scenario: The final stage's commit unlocks the debrief instead of a next stage
- **WHEN** a valid answer is committed for the last stage in the case
- **THEN** the response SHALL signal the debrief is unlocked, with no next stage id

#### Scenario: Re-committing an already-committed stage is rejected
- **WHEN** a second commit is submitted for a stage the attempt already has a commit for
- **THEN** the request SHALL be rejected and the original commit SHALL remain unchanged
