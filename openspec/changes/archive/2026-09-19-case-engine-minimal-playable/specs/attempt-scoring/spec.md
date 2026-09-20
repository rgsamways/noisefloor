## Purpose

The pure scoring logic behind a stage commit — turning an option choice or free-text answer into a score and feedback, and turning a completed path into a total that rewards revising a wrong theory, not just guessing right the first time.

## ADDED Requirements

### Requirement: Option answers score from the rubric's per-option value
Given an `options`-kind rubric and a chosen option id, scoring SHALL return that option's `score` and `feedback` exactly as authored.

#### Scenario: A chosen option returns its authored score and feedback
- **WHEN** an answer selects an option with `score: 2` and `feedback: "Reasonable, but not the whole picture yet."`
- **THEN** scoring SHALL return score `2` and that exact feedback text

### Requirement: Free-text answers score by keyword/phrase presence
Given a `freeText`-kind rubric and a free-text answer, scoring SHALL check the answer for the presence of each `mustMention` phrase, the absence of each `mustNotMention` phrase, and the presence of each `bonus` phrase, producing a score that reflects how many criteria were met.

#### Scenario: Missing a required phrase lowers the score
- **WHEN** a free-text answer omits a phrase listed in `mustMention`
- **THEN** the resulting score SHALL be lower than an otherwise-identical answer that includes it

#### Scenario: Including a forbidden phrase lowers the score
- **WHEN** a free-text answer includes a phrase listed in `mustNotMention`
- **THEN** the resulting score SHALL be lower than an otherwise-identical answer that omits it

### Requirement: Hybrid rubrics score whichever form the answer took
Given a `hybrid`-kind rubric, an answer submitted as a chosen option SHALL score via the rubric's `scores`, and an answer submitted as free text SHALL score via the rubric's `criteria` — the same stage accepts either form.

#### Scenario: A hybrid stage scores a free-text answer by keyword criteria
- **WHEN** a `hybrid`-kind stage's answer is submitted as free text
- **THEN** scoring SHALL apply the rubric's `criteria`, not its `scores`

### Requirement: A path's total score includes a revision bonus
Given a completed attempt's ordered stage commits, the path score SHALL be the sum of each stage's score, plus a bonus when a later hypothesis-kind commit represents a meaningfully different theory than an earlier hypothesis-kind commit in the same attempt.

#### Scenario: Revising a hypothesis earns more than guessing the same thing twice
- **WHEN** two attempts both score identically on each individual stage, but one attempt's later hypothesis commit differs from its earlier one while the other's is unchanged
- **THEN** the attempt that revised SHALL have a higher total path score
