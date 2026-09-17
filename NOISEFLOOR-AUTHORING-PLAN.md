# noisefloor.ca — Authoring & Ladder Plan

> Companion to `NOISEFLOOR-OUTLINE.md`. That document defines v1: curated cases, played by trainees.
> This document defines what comes after: **users build cases**, access to building and publishing is **earned by demonstrated skill**, and the community keeps cases honest through **review and challenge**.
>
> Read the outline first. Everything here assumes its case model (§5), package layout (§6), privacy rules (§12) and phases (§13). Where this plan changes v1 it says so explicitly in §11.

---

## 0. The thesis

Playing a case tests whether you can read the instruments. **Building** a case tests whether you understand why the instruments say what they say — because a synthetic world only renders if its numbers agree, and the builder won't let them disagree silently.

That makes authoring the natural upgrade path from T1 to T2 to T3 and network admin. It also makes authoring the thing that will attract, and then expose, the people with the most to contribute. The design has to make that exposure feel like a puzzle, not an exam (see §9).

The product becomes two-sided: a **library** that grows from the people using it, and a **ladder** that gives them a reason to.

## 1. On "contentious and cutthroat"

There is a version of this that becomes a leaderboard blood-sport: whose case is hardest, who got the most people wrong, who has the highest rank. It would be lively for a month and then empty, because:

- The T2s who most need to decompress their knowledge are exactly the ones who won't publish into a hostile room (outline §9 discussion; this plan §9).
- "Hardest case" optimizes for gotcha traps and ambiguous rubrics, not for teaching. Difficulty inflates; learning value collapses.
- Rank attached to people invites gaming; rank attached to cases invites review.

So the rule is: **competition is over cases, never over people.** A case can be challenged, disputed, revised, retired, and its author is named. A person has a track record — cases built, cases that held up, challenges upheld — but there is no global ranking of humans and no "beat" mechanic between two users.

What *is* deliberately adversarial:

- **Challenge.** Any player can dispute a stage's rubric with a written argument. Adjudication is public (to the case's visibility tier), and an upheld challenge changes the case. Authors want their cases to survive challenge; that is the healthy pressure.
- **Hold-up rate.** A case's public record includes how many challenges it faced and how many were upheld. A case that has survived twenty challenges is a better case, and everyone can see why.
- **Fault-finding as a stage type.** Some cases are authored with a deliberate error (a wrong number, a rubric that rewards the wrong action) and the prompt is "find what's wrong with this case." That gives the cutthroat instinct a sanctioned outlet aimed at the material, not the author.

The contentious energy is real and useful. It just has to be pointed at the work.

## 2. Roles and the ladder

Access is earned, in order. Each rung unlocks by **demonstrated skill on the site**, never by self-declared job title. Titles are shown as a label only if the user chooses to state one, and confer nothing.

| Rung | Name | Unlocks | Earned by |
|---|---|---|---|
| 0 | Reader | play anonymous demo | — |
| 1 | Trainee | play all curated cases, progress, gotcha index | account |
| 2 | Builder | design screen; **private** cases; self-test | complete N curated cases with a path score ≥ threshold; at least one revision-bonus path (shows they revise, not just guess) |
| 3 | Contributor | publish to **team**; propose to public queue; challenge others' cases | ≥ M private cases that pass the validator; ≥ 1 self-test completed on own case; ≥ K challenges submitted that were adjudicated (upheld or not — participating is the point) |
| 4 | Reviewer | adjudicate challenges; approve public queue; retire cases | cases with sustained hold-up rate; challenge accuracy (upheld / submitted) above threshold; invited by existing reviewers or by the operator |
| — | Owner | pays; creates/governs an org; buys seats; appoints leads; sets the org's internal curriculum | the card; off the ladder entirely (see §7) |
| — | Operator | everything; final say | Robin |

Thresholds (N, M, K, score) are config, not code, and should start low. **[DECIDE]** initial values; suggested N=3 cases, M=2 private cases, K=2 challenges.

Team scope is an org the user belongs to (see §7). A team lead role sits alongside the ladder rather than on it: it grants assignment and visibility over their team's attempts, not authoring privileges.

**Org creation is a Reviewer privilege.** Anyone can be *invited* into an org, but only a Reviewer can *create* one. This is deliberate: it makes the top rung the beachhead into a company. A WISP arrives on noisefloor because its best tech is already here and wants to bring the team, not because of marketing. See §7a.

**Rung naming. [DECIDE]** Whether to label rungs T1/T2/T3 (employer-legible, but implicitly a certification claim) or use site-owned names (Trainee/Builder/Contributor/Reviewer as above) with "T2-level" only in prose. Recommendation: **own the claim.** The ladder is harder to game than any exam-based vendor cert because it is earned in public against challenge, and that is the point of the product. If owned, the site must say what a noisefloor "T3" means, exactly, on one page — and expect the claim to be tested by twenty-year veterans stuck at Contributor. The answer to them is the challenge mechanic: "show me the case that stumped you and let's see if it's wrong."


## 3. The World consistency validator

This is the core of the feature and it belongs in `packages/shared` regardless of whether authoring ever ships, because it keeps curated cases honest too. **Pull it into Phase 0 of the outline.**

### 3.1 What it does

Takes a `World` and returns a list of **tensions** — places where the numbers don't agree with each other or with physics — each with a plain-language explanation and the set of edits that would resolve it. It never returns a bare "invalid."

### 3.2 Rule families (initial)

Each rule is a pure function `(world) => Tension[]`, unit-tested, with a `severity: "hard" | "soft"`. Hard tensions block publishing; soft tensions are shown and can be acknowledged with a stated reason that becomes part of the case's debrief ("the AP end is anomalously noisy because …").

**RF link budget**
- Expected received signal from TX power + antenna gains − free-space loss over `distanceM` at `channelMHz`. Actual signal more than X dB below expected → soft tension: "something in the path or off-axis; choose obstruction / misalignment / wrong distance."
- Chain imbalance > 3 dB → soft: requires a cause (obstruction, polarization, alignment).

**SNR → modulation**
- CINR must be consistent with `noiseFloor` and `signal` (CINR ≈ signal − noise ± tolerance).
- Modulation rate must be within the band the CINR supports (table per width; e.g. 6X needs ~low-20s dB, 8X needs ~30+). Rate higher than CINR supports → hard. Rate lower than supported → soft: requires a cause (interference, error rate, config cap).
- `expectedRate` derived from CINR; `actualRate` may differ only with a stated cause.

**Modulation × width × TDD → capacity**
- Capacity per direction must fall within a band derived from PHY rate for (width, rate, streams) × TDD share × overhead. Outside the band → hard.
- Asymmetry between directions must be explained by per-direction CINR/error assumptions; large asymmetry with symmetric SNR → soft.

**Shaper and throughput**
- If a shaper is set, throughput series must not exceed it (after the change timestamp). Shaper below 1 Mbps → soft: "did you mean kbit/s? this will look like an outage" — and if the author says yes, the validator tags the case with the `shaper-units-kbps` gotcha automatically.
- Ping series unaffected by shaper (ICMP passes) unless loss is explicitly authored.

**Device state**
- Router mode + memory ≥ 75 % → soft: reboot/hang risk becomes a plausible fault; validator offers to add a reboot event.
- Cable SNR below vendor red threshold → soft: LAN speed must be 1000 or 100 with a cause.
- Connection time ≤ device uptime always (hard). Connection time reset without a device reboot or AP event → soft.

**Time series coherence**
- Every `WorldEvent` must be reflected in the series it would affect (config change → throughput; reboot → connection time, throughput gap; leaf-out date → signal trace). Unreflected event → hard.
- Every visible discontinuity in a series must have an event or a stated cause → soft.
- Pinglog outages must align with events or be marked "unexplained" (which is a legitimate teaching device).

**Season and geography**
- Foliage generator's leaf-on/leaf-off dates plausible for the stated climate band (soft; config table by rough latitude band).

### 3.3 Output shape

```ts
type Tension = {
  rule: string;                     // "snr.rate-exceeds-cinr"
  severity: "hard" | "soft";
  fields: (keyof World | string)[]; // what's involved
  message: string;                  // "6X at +14 dB CINR won't hold. Either raise signal, lower noise, or drop to 4X."
  resolutions: Resolution[];        // concrete edits, each applyable with one click
  acknowledged?: { reason: string; by: userId; at: string };  // soft only
};
```

### 3.4 Tone

Messages are written as a colleague, not a linter: name what disagrees, say why it matters, offer the choices. Never "invalid," never "error." The validator is the first teacher a Builder meets; it should sound like one.

## 4. The design screen

`apps/web` route `/build/:caseId` (Builder+). Three panes; the same `packages/dashboards` components as the player, in edit mode.

**Left — World.** Grouped fields (customer / site / CPE / AP / link / series / events). Series fields open a generator picker with parameter sliders and a live preview. Customer identity fields are **generated, not typed** (§8). Every edit re-runs the validator; tensions appear inline next to the fields they involve.

**Centre — Live dashboards.** The rendered `crm`, `radio`, `nms` views for the current World, tabbed by family. Change a number, watch the chart move. This is how a Builder learns what a number *looks like*.

**Right — Stages.** Ordered list. Each stage: pick reveals (from the dashboards, by clicking a view and optionally a time range), write the prompt, choose prompt kind, author the rubric. Reveal order is validated: a stage can't depend on evidence not yet revealed; the "what changed?" prompt must have at least one `WorldEvent` before it in the reveal order.

**Bottom bar.** Validator summary (hard / soft counts), Self-test button, Save, Visibility.

### 4.1 Rubric authoring constraints (by rung)

- **Builder:** option prompts only (2–5 options, each scored 0–3 with feedback). Free-text prompts available but **ungraded** in private cases — the Builder writes a model answer and self-assesses.
- **Contributor:** free-text prompts with keyword/phrase rubrics, subject to review before public. Customer-message stages require the standard criteria set (nothing-broken-if-true, timeline, no overpromise, own-the-change) plus author additions.
- **Reviewer/Operator:** full rubric authoring; may mark a rubric as LLM-gradable when that lands (outline §14.3).

### 4.2 Self-test

A Builder plays their own case in a **blind** mode: the World is perturbed within validator-safe bounds (signal ±2 dB, timestamps shifted, a different generator seed) so the charts aren't identical to what they authored, and they answer their own prompts. Self-test completion is required to leave "draft." If the author scores poorly on their own case, that is shown to them, privately, as a tension: "your rubric may not match your world."

### 4.3 Fault-finding cases

Stage prompt kind `findTheFault`: the World is presented as if authoritative and the prompt is "what in this case doesn't hold together?" Rubric is the set of injected tensions. Authored by Contributor+ by starting from a valid World and applying a deliberate inconsistency; the validator records what was broken so grading is exact. This is the sanctioned adversarial format.

### 4.4 The portable case document (`.nfcase.json`)

A case, or a partial World, as a file — so a tech can assemble the numbers from several tools before opening the builder, and so cases can move between orgs or be edited offline.

- **One schema, three surfaces.** The `World`/`Case` Zod schemas in `packages/shared` are the source of truth; a JSON Schema is published from them. The same document validates for the builder's **Import**, for any case's **Export**, and for the v3 promotion endpoint. JSON, not XML; no second format.
- **Identity slots do not exist.** No field for customer name, account ref, IP, MAC, coordinates, SSID, tower or employer name — structurally absent, not "leave blank." Location is a climate band + distance. You cannot paste what there is no place for.
- **Provenance per field (optional).** `{ value, source: "radio.signalPanel", capturedAt }`. Lets the debrief say where a number was read from, and lets the validator weigh a hand-typed value differently from an exported series.
- **The blank template is a worksheet.** "Start a case from a ticket" downloads the document with a where-to-look hint on every slot (*signal → radio link view, Signal panel; capacity 24h → CRM, Link Capacity tab*). Filling it out walks a T1 through the instruments in the order a diagnosis needs them. The format is itself training material.
- Import runs the validator and the synthetic-data scan exactly as a manual World does. A browser helper that reads live dashboards to fill the document belongs on the integrator's side (v3 §1), never in noisefloor.

## 5. Visibility and publishing

| Tier | Who can play | Who can challenge | How it gets there |
|---|---|---|---|
| Private | author | — | default |
| Team | members of author's org | members | Contributor chooses; team lead can request removal |
| Public queue | Reviewers | Reviewers | Contributor proposes; ≥ 2 Reviewer approvals |
| Public | everyone (Trainee+) | Contributor+ | approval; author credited |
| Retired | nobody new; existing attempts readable | — | Reviewer/Operator, with reason; or author withdraws |

Curated (Operator-authored) cases live at Public from the start and are marked "curated." They can be challenged like any other.

Cases are versioned. A challenge that is upheld produces a new version; attempts record which version they were played against; scores are never rewritten retroactively.

## 6. Challenge and adjudication

```
challenges         id, case_id, case_version, stage_id, challenger_id, argument, proposed_change_json, status, opened_at
adjudications      id, challenge_id, reviewer_id, decision (upheld|rejected|partial), rationale, resulting_version, decided_at
```

Flow:
1. Player (Contributor+) opens a challenge from a stage's feedback screen: "I answered X, rubric scored it Y, here's why the rubric is wrong," optionally with a proposed rubric or World edit.
2. Author is notified and may respond once (accept → new version, no adjudication needed; contest → goes to review).
3. Two Reviewers adjudicate independently; disagreement escalates to a third or Operator.
4. Decision and rationale are visible at the case's tier. Upheld → new version, author and challenger both credited on the version note.

Challenge quality is tracked (§7). Frivolous-challenge rate affects Contributor standing, gently: three rejected challenges in a row pauses the ability to open new ones for a period, with a plain explanation.

**Cross-org rules (structural, not behavioural).** The ladder must not quietly become a company org chart when several Reviewers share an employer:
- Public approval requires two Reviewers from **two different orgs**.
- A Reviewer never adjudicates a challenge where the case author *or* the challenger is in their org.
- Challenges against cases from the user's own org do not count toward their track record.
- Same-org Reviewers may coach each other privately; they cannot certify each other publicly.

## 7. Track record (not rank)

Per user, visible on their profile at their choice, never ranked site-wide:

- Cases built (private count only as a number; team/public listed).
- Hold-up rate across their public cases (challenges faced / upheld).
- Challenge accuracy (submitted / upheld).
- Gotchas contributed (a case that introduces a new gotcha the index didn't have).
- Cases played, revision-bonus paths.

Per case, always visible:
- Version, author, reviewers who approved, challenges faced/upheld, plays, median path score, tags, gotchas.

Teams (orgs) get a private dashboard for their lead: attempts per trainee, path patterns (guess-and-stick vs revise), cases assigned. This is the paid tier from the outline's tertiary audience.

**Owner and the org curriculum.** The Owner is the payer and governor of an org, and is off the ladder — they may be a Reviewer or may never have played a case. They buy seats, appoint leads, and define the org's **internal path**: which cases (public or the org's own private ones) new hires must complete, in what order, and what internal designations that unlocks ("senior here once you've cleared our twelve"). Two ladders, deliberately separate: **an org can define its internal path but never a member's global rung.** No org can make anyone a noisefloor Reviewer/T3; that is what keeps the credential worth paying for.

## 7a. The growth loop

The individual tier is the funnel, not the revenue.

1. A tech finds the site, plays free, climbs.
2. The good ones reach Reviewer and create an org for their shop (§2).
3. The org tier — assign cases, see who reasons vs guesses, onboard new hires against the team's own cases — is what the WISP pays for. The buyer is the Owner: the operations manager or proprietor whose T3 is already here. **Pricing is per seat**; a WISP knows exactly how many techs it has. The Reviewer who opens the org hands the keys to whoever pays.
4. That T3's own cases become the shop's onboarding material, which pulls the next hire onto the site.

The asset that compounds is **the validator plus the library**: a body of internally consistent faults, tested against real techs, improved by argument. A competitor can copy the design screen in a month; they cannot copy three hundred cases that survived challenge.

**Learning from the data (the honest version of "ML").** What the site accumulates is worlds, rubrics, attempt paths, and challenge outcomes. Two things are genuinely learnable from that, and both are Phase 9 or later, after a few hundred attempts exist:

- *Which worlds trip which people* — so a Builder is handed a variant at their frontier rather than a random case (adaptive difficulty).
- *What a good path looks like* — the hypothesis sequence strong techs take versus novices — which could eventually grade reasoning, not just answers.

Neither is promised on a landing page, and neither is called machine learning until it is.

## 8. Privacy and abuse (extends outline §12)

Authoring is where real data will try to enter. Controls, in order of preference:

1. **Make the safe path the only path for identity.** No free-text customer name, account number, IP, MAC, coordinates, SSID, or tower name in the World editor. Each is generated from a seeded namer/allocator (documentation IP ranges, locally-administered MACs, a synthetic place-name list, coordinates snapped to a fake grid). Authors can *re-roll*, not type.
2. **Free-text fields are scanned.** Ticket notes, customer-says, colleague-says, prompts, rubrics, challenge arguments run through the synthetic-data check (IP/MAC/phone/email patterns, a real-name denylist the Operator maintains, employer/vendor tokens). Hits block save with the offending span highlighted.
3. **Reviewers check for it explicitly** before public approval; it's the first item on the review checklist.
4. **Report** on every public case; Operator can retire immediately.
5. Vendor-name policy from outline §14.2 applies to user content too: generic in UI, precise only in gotcha explanations. Authors may say "airOS" in a ticket note if the policy lands on "name vendors"; the check enforces whichever way it's decided.
6. Harassment in challenge text or rationale: standard report/retire; repeat → Contributor rung removed. The competitive surface is cases, and the tooling should make it hard to make it personal (no free-text on profiles, no direct messaging in v1).

## 9. Making exposure feel like a puzzle

This section exists because the whole feature fails if a T2 opens the builder once, sees red, and leaves.

- The validator never says invalid. It names the tension and offers choices (§3.4).
- Private is the default and stays private until the author says otherwise. Nothing is auto-shared.
- Self-test results are private. "Your rubric may not match your world" is shown to the author only.
- First challenge an author receives is framed as the case working: "someone cared enough to argue with your rubric." The notification copy matters; write it that way.
- Fault-finding cases give the competitive instinct a target that isn't a person.
- No global human leaderboard. Ever. (§1)
- Progress toward the next rung is shown as "what you've done," not "what you're missing."

## 9a. What will go wrong, in order of how much it should worry us

1. **Cold start** (§12). Nothing above the player matters until people finish cases.
2. **The physics tables.** The validator is only as good as its constants — PHY rates per width and modulation, CINR thresholds, TDD overhead. Wrong constants teach wrong things with authority. One config, sourced, with provenance notes (§13.9).
3. **The credential claim** (§2). Early Reviewers matter enormously; the first few should be people whose judgment the Operator would defend.
4. **Time.** This is sized for a year of evenings around a day job. Something else goes quiet.
5. **The Operator's employer.** A training product built by someone on an ISP's support desk is something that employer can feel proud of or proprietary about. The synthetic-data rules (§8) protect legally. What protects the relationship is telling them early and plainly: this is being built, nothing of theirs is in it, they get the org tier first if they want it. Surprise is the only version that goes badly.

## 10. Data model and API additions

Additions to outline §10–11.

```
cases_user          id, author_id, org_id?, visibility, status(draft|ready|proposed|public|retired), current_version
case_versions       id, case_id, version, world_json, stages_json, validator_report_json, created_by, created_at, note
orgs                id, name, created_by
org_members         org_id, user_id, role(member|lead)
challenges, adjudications   (§6)
ladder_events       user_id, rung, reason, at        (auditable unlock history)
```

```
GET/POST/PUT /build/cases[/:id]              Builder+; returns validator report on every save
POST        /build/cases/:id/self-test       start blind attempt
POST        /build/cases/:id/visibility      Contributor+ for team; proposes for public
GET         /review/queue                    Reviewer+
POST        /review/cases/:id/approve|reject
POST        /cases/:slug/stages/:id/challenge   Contributor+
GET/POST    /review/challenges[/:id]         Reviewer+
GET         /orgs/:id/dashboard              lead
```

Server rules that must hold:
- Rubrics never leave the server for cases the requesting user did not author, same as v1.
- Validator runs server-side on save; the client's inline copy is a convenience and may be stale.
- Visibility changes and version bumps are the only writes that touch what other users see; both are logged.

## 11. What this changes in the v1 outline

1. **Phase 0:** add the World consistency validator (§3), at least the RF budget, SNR→rate, rate→capacity, shaper→throughput, and event-coherence families. Curated cases must pass it.
2. **Phase 1:** dashboards accept an `editable` mode with `onChange` — cheap to add now, expensive to retrofit.
3. **Phase 2:** attempts record `case_version` from day one.
4. **§13 "Later":** authoring UI moves from "later" to a named Phase 6 below; orgs/teams move with it.
5. **§5 Case type:** add `author: { kind: "curated" | "user"; userId? }`, `visibility`, `version` semantics per §5 here; `Prompt` gains `findTheFault`.
6. **§14 decisions:** add ladder thresholds (§2) and adjudication quorum (§6).

## 12. Phases (continuing the outline's numbering)

**Sequencing rule: resist the builder as long as possible.** Ship the player with ~10 curated cases. Watch strangers play them. Learn whether commit-before-reveal holds attention or people bounce at stage two — that one fact decides whether anything above it is worth building. The validator is built regardless (curated cases need it) and later becomes the builder's brain. Order: validator → cases → player → prove people finish → then open the toggles.

**Cold start.** The ladder is useless with five users. Before the builder opens there must be enough curated cases to climb: target 15–20. That is Operator-authored, for a while; the design screen (once it exists, privately) makes that faster too.

**Phase 6 — Builder (private only)**
- Design screen with World editor, live dashboards, stage editor, validator inline.
- Generated identity fields; free-text scan on save.
- Self-test (blind perturbation).
- Ladder rung 2 unlock logic and the `/me` progress view for it.
- **Done when:** a Trainee who has completed three curated cases can build a valid private case, self-test it, and the validator has talked them out of at least one impossible World in the process.

**Phase 7 — Teams**
- Orgs, membership, lead role; team visibility; lead dashboard.
- Contributor rung; team publish.
- **Done when:** a training lead can create an org, invite five trainees, a Contributor on that team can publish a case to it, and the lead can see who revised and who guessed.

**Phase 8 — Public library and challenge**
- Public queue, Reviewer rung, approvals; challenge and adjudication; case versioning surfaced; track record on profiles; fault-finding prompt kind.
- Reviewer invitations start with the Operator hand-picking from Contributors with high hold-up.
- **Done when:** a user-authored case has been proposed, approved by two Reviewers, played by strangers, challenged, and revised — and the version history shows it.

**Phase 9 — Grading and scale**
- LLM-graded free text (outline §14.3) for Contributor+ rubrics, with Reviewer spot-check.
- Case import/export (JSON) so orgs can move content.
- Paid team tier.

## 13. Open decisions

1. Ladder thresholds (§2). Start low; raise when there's data.
2. Adjudication quorum: two Reviewers, or one plus author acceptance?
3. Whether team leads can author without climbing the ladder. (Rec: no — they can assign, not author; it keeps the ladder honest and leads tend to be T2+ anyway.)
4. Whether private cases count toward anything visible. (Rec: count only.)
5. How far the validator's physics tables go in v1 — airMAX-AC-shaped only, or parametrized for other radio families later. (Rec: AC-shaped constants in a config table from day one so a second family is a table, not a rewrite.)
6. Whether to allow direct author↔challenger discussion or keep it strictly through the challenge object. (Rec: through the object only, in v1.)
7. Rung naming: T1/T2/T3 vs site-owned names (§2). (Rec: own it.)
8. Whether org creation is Reviewer-only from day one, or Operator-granted until there are Reviewers. (Rec: Operator-granted until Phase 8; Reviewer-only after.)
9. Physics constants provenance: every value in the validator's tables needs a source note; decide the format before the first table is written.
10. Seat pricing and whether there is a free org tier (e.g. ≤3 seats) to let a Reviewer stand one up before the Owner exists.

## 14. Definition of done for this plan

- A T2 with no prior contact with the site can go from Trainee to Builder in an evening, build a case from a ticket they remember, and be corrected by the validator on at least one relationship they thought they knew — without anyone else seeing it.
- A T3 can publish a two-fault case, have it challenged by a stranger on a rubric detail, lose the challenge, and see the case get better.
- Nobody can be ranked against anybody. Every case can.
- No real customer, employer, or vendor-owned data has entered the library, and the controls that prevent it are structural (generated fields), not hopeful (a policy page).

---

*Companion plan written 2026-09-16, revised same day with §2 org-creation/rung-naming/Owner, §6 cross-org rules, §7 org curriculum, §4.4 portable case document, §7a growth loop and seat pricing, §9a risks, §12 sequencing. The thesis in §0 and the rule in §1 are standing principles; treat the rest as proposals to be superseded by `openspec` changes.*
