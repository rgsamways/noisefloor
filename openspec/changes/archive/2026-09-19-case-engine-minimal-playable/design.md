## Context

See `proposal.md`. Nothing case-related exists yet beyond schemas (`packages/shared`) and the auth-only DB (Phase 0). This is the first time `packages/cases` gets real content and the first time anything in `apps/api` reads/writes product data rather than just auth tables.

## Goals / Non-Goals

**Goals:**
- Case 001 playable end-to-end for stages 1/4/5 (the foliage arc), matching outline §9's actual rubric intent for those stages.
- Server-side commit-before-reveal enforcement — the client physically cannot fetch a stage it hasn't earned.
- Revision-bonus scoring, since that's the product's core pedagogical claim (outline principle 3), not a nice-to-have.
- De-duplicate the page chrome (`PageShell`) before a third and fourth page copy `Landing`/`Me`'s wrapper pattern.

**Non-Goals:**
- Not the full 10-stage case 001 — stages 2/3/6-10 (the RF-anomaly and shaper-collapse subplots) are a later phase. This change's debrief covers only the foliage arc's own resolution, not the full case's eventual multi-layered story.
- Not the anonymous stage-1 demo (outline §8) — the whole case player sits behind `RequireAuth` in this change. Revisit when Phase 4 actually needs the public demo.
- Not `/me/progress` or `/gotchas` — outline §13 scopes those to Phase 4.
- Not a device/radio/nms dashboard — stages 1/4/5 only ever reveal `crm/LinkCapacityChart`, which already exists.

## Decisions

**`Rubric` gains a `hybrid` kind rather than overloading `freeText`.** Alternative considered: score every `hypothesis` answer as free text, treating a chosen option as if its label were typed. Rejected: outline §5.5 explicitly describes per-option scores as their own thing ("each option has score: 0..3 and feedback"), and losing that authored precision when a trainee picks a provided option (rather than typing) would make option authoring pointless for hypothesis stages.

**Revision bonus is a simple heuristic, not semantic analysis.** "Meaningfully different theory" is computed as: two hypothesis-kind commits in the same attempt count as a revision if they resolve to different option ids (option/hybrid-as-option path) or if the later free-text answer matches at least one `bonus` phrase the earlier one didn't (freeText/hybrid-as-text path). This is a defensible proxy, not a claim of understanding the trainee's reasoning — good enough for case 001's stage 1 → stage 4 arc (a plausible-but-incomplete capacity theory revised into the foliage explanation), revisit if a future case's revision pattern doesn't fit this shape.

**Case 001's minimal-slice debrief resolves only the foliage arc.** It reads as complete on its own terms (nothing broken, seasonal, what happens next) rather than teasing the shaper-collapse subplot that doesn't exist yet in this slice. When stages 2/3/6-10 are added in a later phase, the debrief gets rewritten to cover the full story — this version is not a "part 1 of 2" cliffhanger, it's a genuinely finished (if narrower) case.

**`PageShell` component**: `apps/web/src/components/PageShell.tsx`, wrapping children with the existing `min-h-screen flex flex-col pb-[72px] md:pb-16` pattern plus `<BottomNav />`. `Landing` and `Me` switch to it; `Cases`/case-player use it from the start; `SignIn` doesn't adopt it (a centered utility form, not a "browse the app" screen, same reasoning it already omits the floor nav).

**Stage-gating check is "does a commit exist for the prior stage," not a stored "current stage" pointer.** Simpler and self-correcting: an attempt's unlocked stage is always derivable from its `stage_commits` rows, so there's no separate pointer that could drift out of sync with the actual commit history.

**API routes live in `apps/api/src/routes/cases.ts` and `attempts.ts`**, following the existing `health.ts`/`auth.ts` file-per-concern pattern already established in Phase 0.

## Risks / Trade-offs

- **[Risk] The revision-bonus heuristic could reward a lucky option flip that isn't a real revision.** → **Mitigation**: accepted for this slice — outline principle 3 cares about *directionally* rewarding revision over rigid guessing, not perfectly detecting genuine understanding; a keyword/option-based proxy is consistent with v1's existing keyword-rubric approach to free text (outline §5.5, "v2 consideration" for smarter grading).
- **[Risk] Authoring case 001's stages 1/4/5 now, before the full case exists, could mean rework when stages 2/3/6-10 are added later.** → **Mitigation**: stage ids use their eventual final numbering (`s1`, `s4`, `s5`) so inserting the missing stages later doesn't require renumbering anything already played by real attempts.

## Migration Plan

New tables, no existing data to migrate. New API routes are additive. `Rubric`'s `hybrid` kind is additive to an already-shipped schema — existing `options`/`freeText` content (none exists yet in `packages/cases`, but the schema itself is live) is unaffected.
