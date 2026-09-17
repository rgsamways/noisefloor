# noisefloor.ca — Project Plan

> Delivery plan, decision log, and risk register for the build described in `NOISEFLOOR-OUTLINE.md`. That document is the product/technical spec; this one is the "how we're actually going to build it, in what order, and what could go wrong" layer. Read the outline first — this assumes it.

Plan as of 2026-09-16. Supersede sections of this via `openspec` proposals as the build proceeds, same convention as the outline itself.

---

## 1. What's being built, one paragraph

A public web app where fixed-wireless ISP support trainees work through case-based training scenarios rendered as synthetic replicas of the real dashboards they'll use on the job (billing/CRM, radio link view, network controller, and a device/profile-management portal). The pedagogical core — commit to a hypothesis before more evidence unlocks, get scored on revision not just correctness — is fixed and unlikely to change. Everything else (which dashboards exist, how many cases, what reference material surrounds them) is scoped in phases below.

## 2. Team and resourcing

One developer (Robin), domain expertise supplied from his own Tier 1 support role at a fixed-wireless ISP, building with Claude Code as an active collaborator on both code and content. No other contributors currently. This is the single biggest constraint on the plan — see Risk R1.

## 3. Decision log

Decisions already made, with rationale, so later questions ("why does it work this way?") don't require re-litigating them:

| # | Decision | Rationale |
|---|---|---|
| D1 | New repo (`noisefloor`), not inside an existing monorepo | Public product, different audience/deploy cadence/eventual billing than internal tools. Conventions mirrored from `kerfy`, code not shared. |
| D2 | Stack mirrors `kerfy` exactly: pnpm workspaces, React 19 + Vite + Tailwind v4, Fastify 5 + Drizzle + Postgres + Zod, Better Auth | Zero ramp-up; proven working stack. |
| D3 | Vendor naming: generic in UI ("radio link view"), precise only inside gotcha/KB explanations, footer disclaimer | Limits trademark exposure while keeping technical precision where it matters. |
| D4 | Reference screenshots sourced from vendors' public demo instances only, kept outside the repo | Removes any question about employer-owned material touching a public product. |
| D5 | Auth via Better Auth's magic-link plugin, mirroring `kerfy`'s implementation (Resend for delivery, console-logged link in local dev, cross-subdomain cookie handling for `noisefloor.ca` / `api.noisefloor.ca`) | Proven pattern, no password-reset surface to build or support. |
| D6 | Git workflow: commit and push continuously; infra via Railway CLI + Vercel CLI directly, human logs in when a CLI needs it | Consistent with how every other project here runs. |
| D7 | `openspec` initialized in Phase 0, not retrofitted later | Explicit lesson from `kerfy`, where it was skipped and never added. |
| D8 | `sreditor` CLI installed globally, pointed at this repo | Robin's own SR&ED-eligibility tool; judges archived openspec changes against the CRA three-part test in near-real-time instead of reconstructing a claim at filing time. No cost unless `judge`/`rollup`/`report` are actually run (bring-your-own Anthropic key). |
| D9 | A 4th dashboard family, `device` (GDMS-style device/profile management portal), added to scope | Robin's real ticket load includes VoIP ATA and IPTV set-top-box issues whose actual fix lives in a device-management cloud portal, not in radio/CRM/NMS. Chosen deliberately over deferring to a later phase. |
| D10 | A standalone, public knowledge-base (`/kb`) section, separate from the gotcha index | Gotchas stay small and story-driven per outline principle 7; the KB is a broader reference (RF fundamentals, terminology, glossary) readable independent of any case, authored by Claude and reviewed by Robin for accuracy, open to anonymous visitors. |
| D11 | Free-text scoring: keyword/phrase rubric in v1; LLM grading is a v2 consideration, rubric shape kept LLM-friendly now | Avoids per-request LLM cost and latency in v1 while not closing the door later. |
| D12 | Chart rendering: hand-rolled SVG primitives, not a charting library | Full control over the "looks like the real tool" fidelity target; revisit only if `LinkCapacityChart` proves painful to build this way. |
| D13 | `Stage.prompt.options` carries only `{id, label}`; all scoring (`score`, `feedback`, free-text `mustMention`/`mustNotMention`/`bonus`) lives on `Stage.rubric`, never on the prompt | Keeps `NOISEFLOOR-OUTLINE.md` §11's "rubrics never leave the server" structurally true: a `Prompt` is safe to send to the client pre-commit because it never carries scoring data, so there's no field to accidentally leak. |
| D14 | The World consistency validator (`NOISEFLOOR-AUTHORING-PLAN.md` §3) is not part of Phase 0. Phase 0 finishes and archives as originally scoped (schema, generators, magic-link auth, deploy); the validator lands immediately after, as its own `openspec` change (`world-validator`), before any Phase 1 dashboard work. That change also batches in the cheap schema additions from the authoring/integration plans: `Case.author`, `Case.visibility` (both with defaults so existing case content doesn't break), clarified `Case.version` semantics, and a `findTheFault` `Prompt` kind. Provenance-per-field and the `.nfcase` JSON Schema publish wait for Phase 6. | `NOISEFLOOR-AUTHORING-PLAN.md` §11.1 originally said this belonged in Phase 0 — written before Phase 0's `World`/`Case` schema was already built and deployed against Railway, so retrofitting would have meant unwinding live, verified work. Bundling the batch of schema additions together (rather than one openspec change per field) avoids touching the same schema file for a string of tiny, related changes. |

## 4. Phased delivery plan

Phases 0–2 are the critical path: get *one* case genuinely playable end-to-end as fast as possible, because that's the first artifact worth anyone's opinion. Everything after that — the device family, the KB, additional cases — is real, committed scope, but explicitly sequenced *after* that milestone so breadth doesn't delay it.

| Phase | Deliverable | Depends on |
|---|---|---|
| **0 — Foundation** | pnpm workspace (`apps/web`, `apps/api`, `packages/shared`, `packages/dashboards`, `packages/cases`); `openspec init`; Zod schemas for Case/World/Stage; seeded RNG; the five series generators, unit-tested; Better Auth + magic link wired; empty Postgres via Drizzle; Railway (API+DB) and Vercel (web) both serving a "hello" page at `noisefloor.ca` | — |
| **1 — First component** | `crm/LinkCapacityChart` (24h + 1y) rendering from `World`, with annotation support; `/dev/gallery` dev route; one Playwright visual snapshot | Phase 0 |
| **2 — Minimal playable case** *(first thing worth showing anyone)* | Case player route; commit-before-reveal; server-side stage gating; scoring incl. revision bonus; attempts persisted; case 001 authored for **stages 1, 4, 5 only** (the foliage arc), using only `LinkCapacityChart` + text evidence | Phase 1 |
| **3 — Full case 001 + radio/nms families** | `radio/*` and `nms/*` components per outline §7, gallery entries, snapshots; case 001 completed to all 10 stages + debrief + optional branches | Phase 2 |
| **4 — Public v1 launch** | Landing page with anonymous stage-1 demo; `/cases`, `/gotchas`, `/me`; gotcha index seeded from case 001 (10 gotchas); synthetic-data check script wired into CI; footer (about/not-affiliated/contact) | Phase 3 |
| **5 — Device family** *(new, from D9)* | `device/` dashboard components (device list, profile detail, provisioning/push status); `World` schema extended to represent profile/provisioning state, not just RF data; VoIP/ATA "config corruption" case authored | Phase 4, or earlier if it doesn't block Phase 2's milestone |
| **6 — Knowledge base** *(new, from D10)* | `/kb` route and content store; first pass of articles (RF fundamentals, dashboard/instrument glossary), Claude-drafted, Robin-reviewed; cross-links between KB entries and gotchas/cases | Phase 4, in parallel with Phase 5 |
| **7 — Content velocity** | Cases from the backlog (§5 below) authored; `packages/cases/README.md` authoring guide covering both authoring modes (Robin-authored case/gotcha content vs. Claude-drafted/Robin-reviewed KB content) | Phase 4–6 |
| **Later, not scheduled** | Cohorts/assignment for training leads; LLM-graded free text (v2); case-authoring UI; case import/export | — |

## 5. Content backlog (feeding Phase 7)

Seeded from Robin's own support tickets, genericized before anything gets authored (see §7 privacy rules):

- Difficulty-1 "standard T1 checklist" warm-up case (unplug/reseat/check-lights) — tests whether a trainee overthinks something the basics would fix.
- VoIP/ATA "config corruption" case — device shows registered, no dial tone, real fix is recreating the device's profile in the device-management portal. Needs the Phase 5 `device` family.
- Recurring IPTV set-top-box flakiness case — elimination through the stack (radio → router → box). Needs one concrete ticket example before it can be authored; revisit with Robin.
- Flagship "no-fix" case — upstream transport under replacement, customer on a backup service for weeks, correct action is monitor + honest expectation-setting, nothing to dispatch. Directly demonstrates outline principle 5. Candidate for pulling into Phase 3/4 rather than leaving in Phase 7, given how well it demonstrates the core thesis of the product.
- "Which portal do I check" friction — likely a gotcha or in-case stage flavor, not a standalone case.

## 6. Risk register

| # | Risk | Mitigation |
|---|---|---|
| R1 | **Single point of failure on content.** Robin is the only domain expert and is not full-time on this. Case-authoring is inherently slow (structured data + narrative + rubric, per case). | KB content is Claude-drafted to reduce Robin's authoring load on at least one content type. Backlog is captured in writing (this doc + memory) so idle time doesn't lose ideas. Authoring guide (Phase 7) aims to make each new case faster to produce once the pattern is established. |
| R2 | **Scope crept before code existed.** Device family and KB were both added during planning, before Phase 0 started. | Explicit phase sequencing (§4): both are real phases (5, 6), but sit after the Phase 2 minimal-playable-case milestone, not before it. |
| R3 | **Privacy/legal exposure** — real customer data, employer data, or vendor trademarks leaking into a public product. | Outline §12 rules (synthetic-only data, generic UI naming, screenshots never committed) now explicitly extended to the new `device` family and KB content (not just the original 3 dashboard families). `pnpm check:synthetic` CI script (Phase 4) greps case content for real-looking identifiers before merge. |
| R4 | **`World` schema under-scoped for the device family.** The existing schema (`link`, `series`) is RF-specific; profile/provisioning data doesn't fit it as-is. | Called out explicitly as its own design task in Phase 5, to be scoped in an openspec proposal before component work starts — not discovered mid-build. |
| R5 | **Auth cross-subdomain cookie fragility.** `kerfy` had a real, previously-hit bug here (missing `secure: true` alongside `SameSite=None` silently broke local sign-in). | Mirroring the already-debugged `kerfy` pattern exactly (D5) rather than re-deriving it, adapted to the `noisefloor.ca` parent domain. |
| R6 | **Chart fidelity effort.** Hand-rolled SVG primitives (D12) could become a time sink if `LinkCapacityChart` turns out to need more than `StackedBars`/`LineTrace` can cleanly express. | Explicitly reversible decision per the outline; if Phase 1 stalls here, fall back to a charting library rather than over-investing in primitives. |
| R7 | **Reference screenshot access.** Component fidelity depends on reaching vendors' public demo instances (D4). | If a given vendor has no public demo, fall back to documentation screenshots/marketing material as reference, still never committed to the repo. |
| R8 | **Infra cost creep.** Railway (API+Postgres), Vercel (web), Resend (email), and later LLM-grading API calls all cost something. | Everything currently proposed is within typical hobby/free tiers at v1 scale (low user count, low email volume, no per-request LLM calls in v1 scoring). Re-assess before turning on LLM grading (v2) or cohorts (later), both of which have real per-use cost. |

## 7. Governance / process

- **Spec-driven changes:** every feature becomes an `openspec` proposal before code, per outline §6. This is now a hard habit (D7), not a nice-to-have.
- **SR&ED tracking:** `sreditor` runs against this repo's archived openspec changes (D8). Side effect worth naming: since proposals are now visible to a tool applying the CRA's three-part test, there's a light incentive to write proposals with genuine technical rationale rather than boilerplate — good discipline, not something to design around.
- **Version control:** continuous commit-and-push, no long-lived feature branches implied by the plan.
- **Deploy:** Railway CLI (API + Postgres) and Vercel CLI (web) driven directly; human authentication (login) requested from Robin when a CLI needs it, never bypassed.

## 8. Definition of "v1 done"

Unchanged from outline §15 — repeated here since it's the acceptance criteria a manager would actually check against:

- A stranger can open `noisefloor.ca`, play stage 1 of case 001 without logging in, and understand what the site is.
- A logged-in trainee can complete case 001 end-to-end, see a scored path with a revision bonus, read an annotated debrief, and see ten gotchas indexed.
- No real customer, employer, or vendor-owned data anywhere in the repo or the deployed site.
- Every dashboard renders from `World`; changing one number in case 001 changes the chart.
- CI runs unit tests, the synthetic-data check, and visual snapshots for every dashboard component.

Note: this definition predates the device-family and KB decisions (D9, D10). Whether those are required for "v1 done" or ship as fast-follows after the above is a call worth making explicitly once Phase 4 is in sight — flagged here rather than silently assumed either way.

---

*Plan written 2026-09-16, alongside the founding brief. Update via `openspec` proposals as phases complete or scope changes; keep §3 (decision log) append-only rather than editing past entries, so the record of "why" survives.*
