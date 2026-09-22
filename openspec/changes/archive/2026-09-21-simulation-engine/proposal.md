## Why

`packages/console-schema` (implemented and archived 2026-09-21) defines the shape the console reads, but shape alone renders nothing — `docs/NOISEFLOOR-CONSOLE-HANDOFF.md` §10 is explicit that "the schema works" is only provable once something drives it convincingly: "if 21 fields plus a service layer render a believable link in simulation, they'll render a real one in phase two." Right now nothing produces a `RadioLinkTelemetry` value at all. This change is the first thing that does.

§6 sets a specific, non-trivial bar for "believable": fields must move together the way a real radio's do (signal drops → SNR follows → rate steps down → retries climb), not as 21 independent random walks — "anyone who knows radios spots it as fake instantly." That correlated-movement requirement is the hard part of this whole product, and everything else (the fault library, the UI, phase two's real drivers) is easier to get right once it exists.

## What Changes

This proposal is deliberately narrower than the full scope of handoff §5/§6/§7, for the same reason `radio-console-schema` shipped schema-only before anything was built on it: that much surface area reviewed and built at once is hard to review well and easy to get subtly wrong. It establishes the simulation engine's core mechanism and proves it against two representative faults, rather than building the whole fault catalog in one pass.

**In this change:**
- A correlated-movement engine: given a `LinkProfile` and a scenario state, produces a `RadioLinkTelemetry` snapshot at a point in time, where signal/SNR/rate/retries move as a small linked system, not independently (handoff §6.1).
- A healthy-baseline mode: idle correlated movement around numbers that are normal *for that link's profile* (handoff §6.3), with no active fault.
- A staleness/dead-poll mechanic: a simulated far-end drop stops that side's fields from updating while `asOf` timestamps stay frozen at their last value — the console (once it exists) can show a screen that still displays old numbers while they're visibly aging (handoff §4b).
- An extensible time-signature mechanism with exactly two faults built against it, one per side of handoff §6.4's sudden-vs-gradual distinction:
  - **Wind misalignment** — sudden step change that stays (something moved).
  - **Rain fade** — ramps in and later recovers, over a duration that can run from minutes to hours depending on how long the rain lasts (weather passing).

**Explicitly deferred to follow-up changes** (each reuses the time-signature mechanism this change establishes — they are additions to the fault library, not new mechanism):
- The remaining three radio-link fault time-signatures from handoff §6.2: interference (intermittent, daily rhythm), failing cable/water ingress (slow degradation over weeks), foliage growth (seasonal, gradual).
- All five service-layer faults from handoff §5: expired lease, wrong boot order after a power cut, double NAT, rogue DHCP server, customer router offline. (`ServiceLayerTelemetry` already exists in `packages/console-schema`; nothing in this change touches it.)
- Log simulation from handoff §7 (reboot, link drop/reassociate, auth failure, DHCP request/response, with repetition/timing as the actual signal).
- No console UI, no vendor drivers, no persistence — this produces telemetry values a caller can request, nothing else.

## Capabilities

### New Capabilities
- `simulation-engine`: the correlated-movement engine, healthy-baseline mode, staleness/dead-poll mechanic, and the two-fault time-signature mechanism that produces `RadioLinkTelemetry` values over simulated time.

### Modified Capabilities
(none — this reads `packages/console-schema`'s existing types and does not change their shape)

## Impact

- **Affected code**: a new package (name TBD in design.md) that depends on `@noisefloor/console-schema` and produces its types; no existing package is modified.
- **Not affected**: `packages/console-schema` itself (consumed, not changed), `ServiceLayerTelemetry` (deferred), `packages/shared`/`packages/cases` (parked case-study content, untouched — though `packages/shared/src/gen`'s seeded-RNG and time-signature-generator pattern is cited as design precedent, not depended on).
- **Unlocks**: a follow-up change can round out the fault library using the same mechanism; another can build the console UI against live simulated telemetry instead of a static fixture; phase two's real vendor drivers plug into whatever consumes this engine's output today, unchanged.
