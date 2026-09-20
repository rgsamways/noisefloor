## 1. Schema: hybrid rubric

- [x] 1.1 Add the `hybrid` kind to `RubricSchema` in `packages/shared/src/schemas/rubric.ts`; verify a unit test validates a well-formed hybrid rubric and existing `options`/`freeText` tests still pass

## 2. Scoring functions (packages/shared)

- [x] 2.1 Add `packages/shared/src/scoring/score-option.ts`: looks up an `OptionScore` by id; verify a unit test per spec scenario
- [x] 2.2 Add `packages/shared/src/scoring/score-free-text.ts`: `mustMention`/`mustNotMention`/`bonus` phrase matching; verify unit tests for missing-required and forbidden-included cases
- [x] 2.3 Add `packages/shared/src/scoring/score-hybrid.ts`: dispatches to option or free-text scoring based on the answer's shape; verify a unit test per spec scenario
- [x] 2.4 Add `packages/shared/src/scoring/path-score.ts`: sums stage scores plus the revision-bonus heuristic (per `design.md`) across an ordered list of hypothesis-kind commits; verify a unit test proving a revised path outscores an unrevised one at equal per-stage scores
- [x] 2.5 Export the scoring module from `packages/shared/src/index.ts`; verify `pnpm --filter @noisefloor/shared typecheck` passes

## 3. Database (apps/api)

- [x] 3.1 Add `packages/shared`-independent Drizzle tables in `apps/api/src/db/schema.ts`: `attempts` (id, user_id, case_id, case_version, started_at, completed_at, total_score, path_json), `stage_commits` (id, attempt_id, stage_id, committed_at, prompt_kind, answer_json, score, feedback_shown), `gotcha_progress` (user_id, gotcha_id, first_seen_case_id, seen_count), per `NOISEFLOOR-OUTLINE.md` §10; verify `drizzle-kit generate` produces the expected migration
- [x] 3.2 Run the migration against the Railway Postgres instance; verify the three tables exist alongside the existing auth tables

## 4. Case-player API (apps/api)

- [x] 4.1 Add `GET /cases` (public metadata only) in `apps/api/src/routes/cases.ts`; verify it never includes `world`/`stages`/`debrief`
- [x] 4.2 Add `GET /cases/:slug` (opening + ordered stage ids only); verify no stage `reveal`/`prompt`/`rubric` leaks
- [x] 4.3 Add `GET /cases/:slug/stage/:id`, gated on a prior commit existing for an authenticated attempt; verify the gating scenario and that `rubric` is never included
- [x] 4.4 Add `POST /attempts` in `apps/api/src/routes/attempts.ts`, recording the case's current `version`; verify the version is stored at creation
- [x] 4.5 Add `POST /attempts/:id/commit`: scores via `packages/shared`'s scoring functions, persists the commit, returns score/feedback/next-stage-or-debrief-unlocked; verify all three commit scenarios (non-final, final, re-commit-rejected)
- [x] 4.6 Add `GET /attempts/:id` (progress: commits so far, running score); verify it reflects committed stages only

## 5. Case 001 content (packages/cases)

- [x] 5.1 Author case 001's `World` in `packages/cases`, matching `NOISEFLOOR-OUTLINE.md` §9's headline values; verify it validates against `CaseSchema` and produces no *hard* tensions from `validateWorld`
- [x] 5.2 Author stage 1 ("What does this graph tell you about capacity?" — `crm/LinkCapacityChart` 24h, hybrid rubric) per §9; verify it validates
- [x] 5.3 Author stage 4 ("This feels telling." — `crm/LinkCapacityChart` 1y, hybrid rubric scoring the foliage explanation) per §9; verify it validates
- [x] 5.4 Author stage 5 ("What do you tell the customer?" — `customerMessage` prompt, freeText rubric) per §9; verify it validates
- [x] 5.5 Author the foliage-arc debrief (see `design.md` — resolves only what stages 1/4/5 revealed); verify the full `Case` object validates end to end

## 6. Page chrome de-duplication (apps/web)

- [ ] 6.1 Add `apps/web/src/components/PageShell.tsx` (the `min-h-screen`/padding wrapper + `BottomNav`, extracted from `Landing`/`Me`); verify `Landing` and `Me` render identically after switching to it

## 7. Case player UI (apps/web)

- [ ] 7.1 Add `/cases` (list) using `PageShell`; verify it renders cases from `GET /cases`
- [ ] 7.2 Add `/cases/:slug` (player): evidence panel (accumulating, collapsible per outline §8), current prompt, commit action, feedback-then-continue flow; behind `RequireAuth`; verify a full playthrough of stages 1→4→5 end to end against the live API
- [ ] 7.3 Add the debrief view (shown after the final commit); verify it renders after stage 5

## 8. Verification

- [ ] 8.1 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` at the repo root; verify all three pass
- [ ] 8.2 Confirm every scenario in `specs/case-player-api/spec.md`, `specs/attempt-scoring/spec.md`, and `specs/case-content-schema/spec.md` has a passing corresponding test
- [ ] 8.3 Manually play case 001 end to end against the deployed API (`noisefloor.ca`), confirming the revision-bonus path score is visibly higher than a same-answers-both-times control run
