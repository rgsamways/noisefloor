## Why

Nothing is playable yet. `packages/cases` is empty, there's no attempts/scoring persistence, and `apps/web` has no case player. `PROJECT-PLAN.md` Phase 2 scopes the next real milestone precisely: get case 001 playable end-to-end using only its foliage arc (stages 1, 4, 5) — "the first thing worth showing anyone" — rather than waiting for all 10 stages and every dashboard family to exist first.

## What Changes

- Add `attempts`, `stage_commits`, and `gotcha_progress` tables to `apps/api` (Drizzle), per `NOISEFLOOR-OUTLINE.md` §10.
- Add the case-player API surface in `apps/api`: `GET /cases`, `GET /cases/:slug` (shell only — no rubrics, no later-stage evidence), `GET /cases/:slug/stage/:id` (gated on having committed the prior stage), `POST /attempts`, `POST /attempts/:id/commit`, `GET /attempts/:id`. `GET /me/progress` and the `/gotchas` endpoints are **not** in this change — outline §13 scopes those to Phase 4.
- Add scoring functions to `packages/shared`: grading an option-based answer, grading a free-text answer against `mustMention`/`mustNotMention`/`bonus`, and a path-level revision-bonus calculation. Pure functions, unit-tested, no DB — matching outline §6.
- **Schema addition**: `Rubric` gains a `hybrid` kind (`{ scores: OptionScore[], criteria: FreeTextRubric }`) for `hypothesis`-kind prompts, which outline §5.5 describes as scorable *either* by the chosen option *or* by free-text keyword matching — the existing `options`/`freeText` rubric kinds can't express "either form, same stage," so a third kind is needed rather than forcing every hypothesis stage into one mode.
- Author case 001's stages 1, 4, and 5 in `packages/cases`, validated against `packages/shared`'s `Case` schema and the `world-validator` — the first real content to actually run through the validator.
- Add the case player to `apps/web`: `/cases` (list) and `/cases/:slug` (player — evidence panel, commit-before-reveal, feedback), behind `RequireAuth`.

## Capabilities

### New Capabilities
- `case-player-api`: the REST surface for listing cases, starting an attempt, and committing stage answers, with the server-side guarantee that rubrics and future-stage evidence never reach the client.
- `attempt-scoring`: the pure scoring functions — option scoring, free-text keyword scoring, and path-level revision bonus.

### Modified Capabilities
- `case-content-schema`: `Rubric` gains a `hybrid` kind.

## Impact

- **Affected code**: `apps/api` (new DB tables, new routes), `packages/shared` (new `scoring/` module, `Rubric` schema extension), `packages/cases` (first real content), `apps/web` (new `/cases` routes).
- **Scope reductions, explicit**: only stages 1/4/5 of case 001 (not the full 10-stage case — that's a later phase); no anonymous stage-1 demo yet (outline §8's "anonymous users can play case 001 stage 1 only" is Phase 4 polish — this change gates the whole case player behind `RequireAuth`, matching the existing `/me` pattern); no `/me/progress` or `/gotchas` pages.
- **No breaking change** to existing `Rubric` usage — `options`/`freeText` kinds are unchanged, `hybrid` is additive.
