# case-content-schema Specification

## Purpose
Defines the validated data contract for case content — `Case`, `World`, `Stage`, and the types they're built from — so every case-authoring and case-player feature in later phases reads and writes the same shape, checked at build time rather than discovered at runtime.

## Requirements

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

### Requirement: Case records validate against a fixed structure
A `Case` SHALL require `id`, `slug`, `title`, `version`, `difficulty` (1, 2, or 3), `estimatedMinutes`, `tags`, `gotchas`, `world`, `opening`, `stages` (a non-empty ordered list), and `debrief`. `optionalBranches` SHALL be permitted but not required.

#### Scenario: Case missing a required field fails validation
- **WHEN** a case object is validated that omits `world` or has zero `stages`
- **THEN** validation SHALL reject it with an error identifying the missing/invalid field

#### Scenario: Well-formed case passes validation
- **WHEN** a case object supplies every required field with correctly-typed values
- **THEN** validation SHALL accept it and produce a typed `Case` value

### Requirement: World captures every value a case's dashboards render from
A `World` SHALL include `customer`, `site`, `cpe` and `ap` devices, `link` (signal/chain/noise-floor/CINR/rate/capacity/latency/airtime fields), `series` (named time-series or generator references), `stationList`, and `events`. No dashboard component in `packages/dashboards` SHALL require data outside of a `World` or a named slice of one.

#### Scenario: Changing one World value changes what renders
- **WHEN** a single numeric field in a case's `World` (e.g. `link.signalLocalDbm`) is changed
- **THEN** any dashboard rendering that field SHALL reflect the new value with no other code change

### Requirement: Stage structure enforces evidence, a prompt, and a rubric together
A `Stage` SHALL require `id`, `title`, `reveal` (a list of `Evidence`), `prompt`, `rubric`, and `feedback`. `Evidence` SHALL be one of the kinds: `dashboard`, `customerSays`, `ticketNote`, or `colleagueSays`. `Prompt` SHALL be one of: `hypothesis`, `nextCheck`, `whatChanged`, `customerMessage`, `ticketNote`, or `action`.

#### Scenario: Stage with an unrecognized evidence or prompt kind fails validation
- **WHEN** a stage's `reveal` array or `prompt` object uses a `kind` value outside the defined set
- **THEN** validation SHALL reject the stage

### Requirement: Rubric shape supports both option-based and free-text scoring
For option-based prompts (`hypothesis` with options, `nextCheck`, `action`), each `Option` SHALL carry a `score` in the range 0–3 and a `feedback` string. For free-text prompts (`hypothesis` free text, `whatChanged`, `customerMessage`, `ticketNote`), the rubric SHALL express its criteria as `mustMention`, `mustNotMention`, and `bonus` phrase lists — a shape that does not require restructuring if an LLM grader replaces the keyword matcher later.

#### Scenario: Free-text rubric is gradable by keyword match
- **WHEN** a free-text answer is checked against a rubric's `mustMention` and `mustNotMention` lists
- **THEN** the check SHALL produce a score without requiring any change to the rubric's stored shape

### Requirement: Gotchas link back to the cases that seeded them
A `Gotcha` SHALL require `id`, `title`, `oneLiner`, `explanation`, and `cases` (a non-empty list of case ids that reference this gotcha).

#### Scenario: A case's gotcha reference resolves to a real gotcha entry
- **WHEN** a case lists a gotcha id in its `gotchas` field
- **THEN** a `Gotcha` record with that id SHALL exist and list the case's id back in its own `cases` field

### Requirement: Rubric supports a hybrid kind for hypothesis stages answerable either way
`Rubric` SHALL support a `hybrid` kind (`{ scores: OptionScore[], criteria: FreeTextRubric }`) for stages whose prompt accepts either a chosen option or free text — a `hypothesis`-kind prompt's own `allowFreeText: true` means either form can be scored, and neither the existing `options`-only nor `freeText`-only rubric kind can express both.

#### Scenario: A hybrid rubric is valid case content
- **WHEN** a `Stage`'s `rubric` is `{ kind: "hybrid", scores: [...], criteria: {...} }`
- **THEN** it SHALL validate successfully against the `Rubric` schema

### Requirement: Device carries optional cosmetic radio-header fields
`Device` (the `cpe`/`ap` shape within `World`) SHALL support optional `mac`, `txPowerDbm`, and `lanSpeedMbps` fields for display in `radio/LinkHeader` and `radio/DeviceDetails`. None of the three SHALL be required, and none SHALL participate in any `world-consistency-validator` rule.

#### Scenario: A pre-existing Device without the new fields still validates
- **WHEN** a `Device` object with no `mac`, `txPowerDbm`, or `lanSpeedMbps` field is validated
- **THEN** it SHALL be accepted

#### Scenario: A Device with the new fields set still validates
- **WHEN** a `Device` object sets `mac`, `txPowerDbm`, and `lanSpeedMbps` to well-typed values
- **THEN** it SHALL be accepted

### Requirement: World supports point-in-time realtime ping snapshots
`World` SHALL support an optional `realtimePings` array, each entry carrying `targetLabel`, `rttMs`, `lossPct`, and an optional `avgRttMs` — for `crm/RealtimePingModal`'s point-in-time reading, distinct from any time-series data.

#### Scenario: A World without realtimePings still validates
- **WHEN** a `World` object with no `realtimePings` field is validated
- **THEN** it SHALL be accepted

#### Scenario: A World with realtimePings set validates
- **WHEN** a `World` object sets `realtimePings` to a well-formed array of snapshots
- **THEN** it SHALL be accepted

### Requirement: World supports a device-backups list
`World` SHALL support an optional `deviceBackups` array, each entry carrying a `label` and `at` timestamp — for `nms/DeviceManagePane`'s backups display.

#### Scenario: A World without deviceBackups still validates
- **WHEN** a `World` object with no `deviceBackups` field is validated
- **THEN** it SHALL be accepted

### Requirement: WorldSeries supports a transmit-side hourly throughput series
`WorldSeries` SHALL support an optional `throughputTx1h` key, parallel to the existing `throughputRx1h`, for displaying RX/TX symmetry (or asymmetry) over the same one-hour window.

#### Scenario: A WorldSeries without throughputTx1h still validates
- **WHEN** a `WorldSeries` object with no `throughputTx1h` field is validated
- **THEN** it SHALL be accepted
