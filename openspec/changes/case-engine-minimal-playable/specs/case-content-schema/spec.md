## ADDED Requirements

### Requirement: Rubric supports a hybrid kind for hypothesis stages answerable either way
`Rubric` SHALL support a `hybrid` kind (`{ scores: OptionScore[], criteria: FreeTextRubric }`) for stages whose prompt accepts either a chosen option or free text — a `hypothesis`-kind prompt's own `allowFreeText: true` means either form can be scored, and neither the existing `options`-only nor `freeText`-only rubric kind can express both.

#### Scenario: A hybrid rubric is valid case content
- **WHEN** a `Stage`'s `rubric` is `{ kind: "hybrid", scores: [...], criteria: {...} }`
- **THEN** it SHALL validate successfully against the `Rubric` schema
