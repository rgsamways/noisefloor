## ADDED Requirements

### Requirement: Case records an authorship and visibility tier
A `Case` SHALL include an `author` field (`{ kind: "curated" | "user"; userId?: string }`) and a `visibility` field. Both SHALL default such that a case object written without them still validates, defaulting to `{ kind: "curated" }` and `"public"` respectively.

#### Scenario: A pre-existing case object without author/visibility still validates
- **WHEN** a `Case` object with no `author` or `visibility` field is validated
- **THEN** it SHALL be accepted, with `author` defaulting to `{ kind: "curated" }` and `visibility` defaulting to `"public"`

#### Scenario: A user-authored, private case is representable
- **WHEN** a `Case` object sets `author: { kind: "user", userId: "u_123" }` and `visibility: "private"`
- **THEN** it SHALL be accepted

### Requirement: Prompt and Rubric support a fault-finding stage type
`Prompt` SHALL support a `findTheFault` kind (free text: "what in this case doesn't hold together?"). `Rubric` SHALL support a matching `findTheFault` kind referencing the specific validator rule ids that were deliberately violated to construct the stage.

#### Scenario: A fault-finding stage's rubric references validator rules
- **WHEN** a `Stage`'s `prompt.kind` is `"findTheFault"`
- **THEN** its `rubric.kind` SHALL be `"findTheFault"` and SHALL list one or more rule ids matching the world-consistency-validator's own rule identifiers
