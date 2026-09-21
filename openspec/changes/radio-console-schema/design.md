## Context

See `proposal.md` and `docs/NOISEFLOOR-CONSOLE-HANDOFF.md` §4–§6 (the source for every field/group named here). This is the first concrete step of the console pivot — everything else (simulation engine, UI, phase-two vendor drivers) reads and writes this schema, so getting its shape reviewed before anything is built on top of it matters more than usual. This proposal is deliberately schema-only: **no simulation engine, no UI, no vendor driver** — see Non-Goals.

## Goals / Non-Goals

**Goals:**
- One normalized schema for the radio-link panel (handoff §4, four field groups + time-evidence §4a), one for the service-layer panel (handoff §5) — kept as two separate top-level types, matching the doc's "two panels, not one" framing (§3).
- Every field individually carries staleness (§4b) — not a per-panel "last updated" timestamp, since a real fault mode is exactly "some fields are fresh, some are stale, and the panel has to show the difference."
- A `LinkProfile` shape (distance/band/gear class, §6.3) that later consumers (simulation engine, UI) use to judge whether a reading is normal for *this* link — this change only defines its shape, not the normalness logic itself.
- A `vendorExtras` escape hatch (§4, closing line) so a future vendor driver never has to force a real reading into a core field that doesn't fit it.

**Non-Goals:**
- No simulation engine. The handoff doc (§6) specifies real behavioral requirements for it (correlated movement, fault time-signatures, sudden-vs-gradual) that deserve their own design, not a rushed appendage to a schema change.
- No console UI.
- No vendor driver, no real API client, no phase-two work of any kind. The handoff doc's own architecture (§9: drivers → normalizer → UI) treats driver work as downstream of this schema, and phase two isn't started here.
- No derived-value logic (e.g. computing SNR from signal minus noise floor when a vendor doesn't report it directly, per §4's SNR row). That's behavior, not shape — it belongs wherever the value gets computed (simulation engine now, a real normalizer in phase two), not in the schema package.
- No parked case-study schema is touched. This is a new, standalone package — see Decisions.

## Decisions

**New package, not an addition to `packages/shared`.** `packages/shared/src/schemas` is the parked case-study `World`/`Case` schema (see its README) — adding console types alongside it risks exactly the "which schema is live" confusion this whole pivot is trying to avoid. Proposed name: `packages/console-schema` (open to a better name on review — not load-bearing, easy to rename before anything depends on it).

**Field grouping mirrors the handoff doc's own four groups, plus time-evidence as a named fifth.** `link` (signal, noise floor, SNR, link quality, modulation/MCS, frequency, channel width, link state, chain imbalance, TX power), `throughput` (TX/RX rate, airtime, channel utilization, client count), `farEnd` (distance, latency, jitter, packet loss, errors/retries), `radioHealth` (CPU/memory, temperature, uptime), `timeEvidence` (last reboot, last log entry, last successful poll) — kept as its own group per handoff §4a's explicit instruction not to bury it inside `radioHealth` the way vendor screens do.

**Staleness is a generic per-field wrapper, not a per-panel timestamp.** `Reading<T> = { value: T; asOf: string }` (ISO timestamp), applied to every leaf field in both `RadioLinkTelemetry` and `ServiceLayerTelemetry`. This is what makes handoff §4b's core teaching point ("a naive panel keeps showing stale values and looks healthy while the link is dead") representable at all — a single top-level `lastUpdated` field can't express "chain imbalance is fresh but far-end latency hasn't updated in ten minutes," which is exactly the scenario §4b asks the console to be able to show.

**`LinkQuality`, `SNR`, and other honestly-approximate fields are documented as approximate in the schema's comments, not hidden.** Handoff §4 flags several fields as vendor-inconsistent (CCQ vs. Cambium link efficiency; SNR not directly reported by Cambium ePMP/PMP450). The schema doesn't try to resolve that tension — it names the field once, generically, and the doc-comment on it says plainly what it actually represents and where it can diverge, so a future normalizer author isn't misled into thinking it's a clean 1:1 vendor mapping.

**Phase-two field naming is a hint carried in comments, not a constraint enforced now.** The deleted `radio-link-view` proposal (case-study era, superseded) had already done real work here worth not losing: Robin's separate Meridian project has a UISP API client hardware-confirmed against a live NanoBeam M5 (2026-09-05), with real field names — `signal`/`signal2` (the two per-chain readings), `cpu`, `ram` (not "memory"), `uptime` (raw seconds), `status`, `model`. Where this schema's fields correspond to something Meridian already confirmed real (`radioHealth.cpuPct`/`ramPct`/`uptimeSeconds`, `link.chainImbalanceDb` derived from a `signal`/`signal2` pair), the doc-comment says so and cites `C:\dev\meridian\src-tauri\src\devices\uisp.rs` — purely informational, so a phase-two driver author isn't starting from zero, but nothing here depends on or validates against Meridian's shape.

## Risks / Trade-offs

- **[Risk] The schema is derived from a written doc, not implementation experience — some fields may prove wrong or missing once a simulation engine actually tries to drive them believably.** → **Mitigation**: this is precisely why schema is its own change, reviewed before simulation-engine or UI work starts, rather than discovered mid-build. Expected to take more than one pass — flagged as such to Robin already.
- **[Risk] Temptation to fold derived-value logic (SNR-from-noise-floor, staleness-driven greying) into the schema package "since it's related."** → **Mitigation**: explicit Non-Goal above; schema package has no behavior, only shape and Zod validation.
- **[Risk] `packages/console-schema` as a name/location could be premature.** → **Mitigation**: nothing depends on it yet; a rename before the simulation-engine change lands is a non-event.
