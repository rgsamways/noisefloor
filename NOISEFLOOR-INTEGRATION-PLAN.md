# noisefloor.ca — Integration Plan (v3: the seam into live work)

> Third document in the set.
> `NOISEFLOOR-OUTLINE.md` (v1) — trainees play curated cases.
> `NOISEFLOOR-AUTHORING-PLAN.md` (v2) — users build cases; access is earned; the community keeps cases honest.
> **This document (v3)** — the ladder becomes a **permission model** for live support work, and live tickets become the **source of cases**. Noisefloor does this by exposing a small, well-defined seam that ticketing systems consume — not by becoming a ticketing system.
>
> Read v1 and v2 first. This plan continues their numbering (phases 10+) and does not change anything in them except where §9 says so.

---

## 0. The thesis

Every ticketing system assigns capabilities by job title. Noisefloor can assign them by **what a person has demonstrated**. A tech's rung — earned in public, against challenge, on synthetic cases — becomes the thing that decides what they may touch on a live customer's service.

And the loop closes: a real ticket, resolved well, is a case waiting to be written. Promote it through the same identity generators the builder uses, and the shop that resolved it gets onboarding material for its next hire, while the best of those cases flow to the public library through v2's review path.

The training system and the production safety rails become the same artifact. The gotcha that today's incident taught is the guardrail that prevents tomorrow's.

## 1. The rule that governs this whole document

**Noisefloor never holds real customer data.**

v1 and v2 are synthetic-only, structurally (generated identity fields, scanned free text). v3 introduces contact with systems that *do* hold real data. The boundary is:

- Real data lives in the **ticketing system** (the integrator's), never in noisefloor's database.
- Noisefloor receives only: a user's identity (its own accounts), rung queries, and **already-redacted** ticket payloads that pass the synthetic-data check on arrival. Payloads that fail are rejected, not sanitized — sanitization implies noisefloor saw the real thing.
- Redaction happens **on the integrator's side**, using a noisefloor-published redaction library (§4.3), before anything leaves their system.
- Noisefloor logs that a promotion happened and by whom; it never logs the source ticket's content.

If a feature cannot be built inside this rule, it is not built in noisefloor. It is built in the ticketing system, using noisefloor's seam.

## 2. What noisefloor is and is not, in v3

**Is:** a competence registry (rungs, verifiable), a policy feed (guardrails derived from gotchas), a case-promotion endpoint (redacted ticket → draft World), and the training/authoring platform of v1–v2.

**Is not:** a ticketing system, a CRM, a customer-facing support portal, a place where PII lives, or a system of record for anything about a real customer.

**Deferred, explicitly:** a noisefloor-branded customer-facing ticket front end. Revisit only after the seam is proven with at least one real integration (§8). The likely answer is "never — let ticketing systems come to us."

## 3. The seam: three interfaces

All three are versioned HTTP APIs under `api.noisefloor.ca/v3/`, authenticated per **org** (v2 §7) with scoped API keys the Owner issues. Rate-limited, audited, revocable.

### 3.1 Competence API (read)

Answers "what has this person demonstrated?" for a member of the integrator's org.

```
GET /v3/members/:memberId/standing
→ {
    rung: "trainee" | "builder" | "contributor" | "reviewer",
    rungSince: ISO8601,
    gotchasCleared: GotchaId[],          // gotchas the member has seen in a completed case
    orgPath: { completedRequired: n, totalRequired: m, internalDesignation?: string },
    verifiable: { statementId, signedAt, signature }   // detached signature for offline check
  }
```

Notes:
- `memberId` is a noisefloor user id linked to the org. Linking is done by the user accepting an org invite (v2 §7); the integrator never learns a user's noisefloor identity beyond that link.
- `gotchasCleared` is the interesting field. It lets an integrator gate at the level of *specific hazards*, not just rung: "may edit traffic shaping only if `shaper-units-kbps` cleared."
- `orgPath` reflects the Owner-defined internal curriculum (v2 §7). Integrators can gate on internal designation without noisefloor knowing what the designation means.
- Standing can also be pushed: `POST /v3/webhooks` for `standing.changed` events, so a ticketing system updates permissions without polling.

### 3.2 Policy feed (read)

Turns the gotcha index into machine-readable guardrails.

```
GET /v3/policies?family=radio&scope=config-change
→ [
    {
      gotcha: "shaper-units-kbps",
      trigger: { field: "tshaper.rate", when: "value < 1000" },
      requires: { gotchaCleared: "shaper-units-kbps" } | { rung: "builder" },
      message: "Traffic shaping is in kbit/s. 50 here is 50 kbit/s and will look like an outage. Did you mean 50000?",
      severity: "confirm" | "block"
    },
    ...
  ]
```

Notes:
- Policies are **advisory data**. The integrator decides whether to show a confirm dialog, block, or ignore. Noisefloor does not enforce anything on live systems; it publishes what it knows.
- Each policy links to its gotcha and the cases that teach it, so a blocked action can offer "clear this in ten minutes" — the case player, right there.
- The feed grows from v2: a gotcha becomes a policy when a Reviewer writes its trigger shape. Not every gotcha is machine-triggerable (`own-your-change` is not); those stay in the index only.

### 3.3 Promotion API (write, redacted only)

Turns a resolved ticket into a draft case in the resolving tech's private builder.

```
POST /v3/promotions
{
  orgId, memberId,
  redacted: RedactedTicket,          // produced by the noisefloor redaction library, §4.3
  attestation: { libraryVersion, checksum }
}
→ 202 { promotionId, draftCaseId }   // draft appears in the member's /build list
   or 422 { rejected: true, reasons: [...] }   // synthetic-data check failed; nothing stored
```

`RedactedTicket` is the portable case document of v2 §4.4 (`.nfcase.json`) with identity slots structurally absent; the same JSON Schema validates both. It carries only what a World needs: device models, RF numbers, series (already downsampled), events with relative timestamps, plan values, free-text notes **that passed the scan**. Identity fields arrive as `null` and are regenerated by the builder's generators. Coordinates arrive as a climate band and a distance, never a location.

The draft is a v2 private case: World pre-filled, events pre-filled, stages empty. The tech writes the stages, the validator checks the World (and will often catch real-world inconsistencies the ticket never noticed — a teaching moment in itself), self-tests, and decides visibility. Nothing about promotion bypasses v2's ladder, review, or challenge rules.

## 4. What the integrator builds (and what noisefloor gives them)

### 4.1 Integrator responsibilities
- Hold the real data. Map their staff to noisefloor members via org invites.
- Decide their permission mapping: which rung / gotcha / internal designation unlocks which actions in *their* system.
- Run the redaction library before any promotion. Attest the version.
- Surface policies as they see fit (confirm, block, log).

### 4.2 Noisefloor deliverables to integrators
- The three APIs, versioned, with a sandbox org for testing.
- **`@noisefloor/redact`** (§4.3).
- **`@noisefloor/policies`** — a tiny client that fetches the feed, caches it, and evaluates a proposed config change against it: `evaluate({ field, value, member }) → { allow | confirm | block, policy }`.
- A reference integration (§8) showing all three in a real ticketing app.
- A plain-language integration guide with the one rule from §1 on page one.

### 4.3 `@noisefloor/redact`

Published from `packages/redact` (new, TS, zero runtime deps beyond `shared`'s generators).

- Input: the integrator's ticket + telemetry in a documented shape.
- Output: `RedactedTicket` + a checksum.
- Removes: names, account refs, emails, phones, IPs, MACs, coordinates, SSIDs, tower/site names, employer tokens, and anything matching the free-text scanner. Replaces with `null` (not fakes — fakes are generated later, inside noisefloor, so no real-to-fake mapping ever exists anywhere).
- Runs **entirely in the integrator's process**. Makes no network calls. The attestation lets noisefloor reject payloads from unpatched versions.
- Open source (**[DECIDE]** licence) so integrators can audit that it does what §1 promises.

## 5. Permission model — reference mapping

Noisefloor does not impose this; it is the mapping the reference integration ships with and the guide recommends. Integrators edit it.

| Action in the ticketing system | Requires |
|---|---|
| View a ticket, add a note | org member |
| Run non-invasive diagnostics (ping, link view) | Trainee |
| Change customer plan in CRM | Trainee + `orgPath` designation "onboarded" |
| Edit CPE traffic shaping | Builder **and** `shaper-units-kbps` cleared |
| Edit CPE network mode / management settings | Builder + `router-mode-memory` cleared |
| Reboot / power-cycle CPE remotely | Trainee |
| Push CPE config backup restore | Builder |
| Change AP channel / width | Contributor |
| Approve a dispatch | Contributor |
| Override any of the above | Reviewer, or the org's Owner-designated lead |
| Promote a ticket to a case | Builder (the promotion lands in their private builder) |

Note the shape: the ladder alone gates coarse actions; **gotcha-cleared** gates the specific hazards. A Builder who has never met the kbit/s trap still cannot edit a shaper until they have played the case that teaches it. That is the entire point.

## 6. Guardrails in the moment

The reference integration shows what §3.2 looks like in use:

1. Tech opens the shaper field, types `50`.
2. `@noisefloor/policies.evaluate` returns `confirm` with the `shaper-units-kbps` message.
3. Dialog: the message, plus "Clear this gotcha (10 min)" linking to the case, plus "Proceed" if their rung allows.
4. If they proceed, the integrator logs the override with the policy id. If it goes wrong, the ticket note already says what changed and when — v1's `what-changed-when` and `own-your-change` gotchas, enforced by the tooling instead of by memory.

The training material and the safety rail are one artifact. This is the demo that sells the org tier.

## 7. Data model and API additions (noisefloor side only)

```
org_api_keys        id, org_id, scope[], created_by, revoked_at
member_links        org_id, user_id, linked_at           (exists in v2 as org_members; add linked_at)
standing_statements id, user_id, org_id, payload_json, signature, issued_at
policies            id, gotcha_id, trigger_json, requires_json, message, severity, authored_by, version
promotions          id, org_id, user_id, draft_case_id, library_version, checksum, received_at
                    (NO ticket content, NO source ticket id)
webhooks            id, org_id, url, events[], secret
```

Nothing above stores a customer, a location, or a ticket body. `promotions` deliberately omits the source ticket id so noisefloor cannot be used to correlate a case back to a real customer even by an insider.

## 8. Reference integration

The first integrator should be a ticketing app the Operator controls, so the seam is proven in a real shop with no negotiation. The Operator is already building such an app (its details live in that repo, not here). The integration is a **separate package inside that app**, consuming noisefloor's three APIs and `@noisefloor/redact`; nothing of that app moves into the noisefloor repo.

**Done when:**
- A tech's permissions in the ticketing app change within a minute of their noisefloor rung changing (webhook).
- A shaper edit under 1000 by a Builder without the gotcha cleared produces the confirm dialog with the case link.
- A resolved ticket is promoted, the payload passes the check, and a draft case appears in the tech's private builder with the World pre-filled — and no field in noisefloor's database contains anything from the source ticket except the draft's synthetic World.
- A deliberately unredacted payload is rejected with a 422 and nothing stored.

## 9. What this changes in v1 / v2

1. v2 §7 `org_members` gains `linked_at` and an org-scoped API key model (§7 here).
2. v2 §5.7 `Gotcha` gains an optional `policy` reference; Reviewers may author policies (§3.2).
3. v2 §4 builder gains a "from promotion" entry point: World and events pre-filled, provenance shown as "promoted from a ticket in <org>, redacted by `@noisefloor/redact` vX".
4. v1 §12 privacy rules gain §1 of this document as a standing principle: **noisefloor never holds real customer data**, and any payload that fails the check is rejected, not cleaned.
5. New package `packages/redact`, published to npm as `@noisefloor/redact`; `packages/policies` likewise.

## 10. Phases (continuing)

**Phase 10 — Competence API**
- Org API keys; standing endpoint; signed statements; `standing.changed` webhook.
- Sandbox org.
- **Done when:** an external script can ask "what rung is member X?" and get a signed answer that verifies offline.

**Phase 11 — Policy feed**
- `policies` table; Reviewer UI to attach a trigger shape to a gotcha; feed endpoint; `@noisefloor/policies` client with `evaluate()`.
- Seed: the ten gotchas from v1 §9, of which perhaps five are machine-triggerable.
- **Done when:** `evaluate({ field: "tshaper.rate", value: 50, member })` returns `confirm` with the right message.

**Phase 12 — Redaction library and promotion**
- `@noisefloor/redact` with tests that include adversarial inputs (names in notes, IPs in odd formats, coordinates as text).
- Promotion endpoint; 422 path; draft creation.
- **Done when:** §8's promotion and rejection criteria pass against the sandbox.

**Phase 13 — Reference integration**
- In the Operator's ticketing app: permission mapping (§5), guardrail dialog (§6), promote button on resolved tickets.
- **Done when:** §8 in full, in a real shop, on real tickets, with nothing real in noisefloor.

**Phase 14 — Second integrator**
- A shop the Operator does not control. Integration guide tested by someone who didn't write it.
- Decide, with evidence, whether a noisefloor-branded customer-facing front end is ever worth building (§2).

## 11. Open decisions

1. Licence for `@noisefloor/redact` (must be auditable; MIT or Apache-2.0 likely).
2. Whether standing statements carry `gotchasCleared` by default or only on request (privacy of the member vs usefulness to the integrator; rec: by default within the member's own org only).
3. Signature scheme for statements (rec: Ed25519, key published at a well-known URL).
4. Whether policies can be org-private (a shop's own guardrails for its own gotchas) — rec: yes, in Phase 11, scoped like private cases.
5. Whether promotion should be allowed from tickets the member did not personally resolve (rec: no in v3; the case author should be the person who did the work).
6. How the Operator's employer relationship is handled if the reference integration runs on that employer's tickets: needs explicit permission, and §1 must be demonstrable to them, not asserted. (See v2 §9a.5.)

## 12. Definition of done for v3

- A ticketing system can gate a config change on a noisefloor rung and a specific cleared gotcha, and the tech who is blocked can clear it by playing a case, right then.
- A resolved ticket can become a draft case in under a minute, and nothing about the real customer exists anywhere in noisefloor — provably, by reading the schema.
- Noisefloor has not become a ticketing system, and the question of whether it ever should has been answered with evidence from two integrations rather than with enthusiasm.

---

*v3 written 2026-09-16. §1 is a standing principle. Everything else is a proposal until an `openspec` change lands.*
