# Session handoff — 2026-09-24 (console scenario picker shipped, fault-catalog domain review starting)

**Status:** everything described below is committed, pushed to `main`, and deployed live on `noisefloor.ca`. Working tree is clean, nothing uncommitted. Read `/README.md` first for always-current orientation, then this doc for what happened today and — most importantly — what's queued up to start next.

## What this session did

**1. Built and shipped the `/console` scenario picker (openspec change `console-scenario-picker`, archived).** `/console` previously played exactly one hardcoded demo scenario. Added a scenario picker exposing all 10 named fault scenarios (Healthy + 5 radio-link faults + 4 service-layer faults), each backed by fault factories that already existed in `packages/simulation-engine`. New `apps/web/src/lib/console-scenarios.ts` defines the scenario bundles; `useDemoLinkTelemetry` takes an optional `scenarioKey` (default matches the old hardcoded demo, so the homepage's call site is unaffected).

**2. Fixed a real domain error caught mid-build: LOCAL/REMOTE was backwards.** Robin's real-world correction: LOCAL is whichever radio you're logged into, and T1 more commonly logs into the customer's (CPE) radio — not the tower. `LinkPanel.tsx` had it the other way around (LOCAL = Sector, REMOTE = CPE). Fixed both the labels and which side the demo fault binds to.

**3. Two real-usage fast-follow fixes, done same day without a full openspec cycle (flagged that choice to Robin, no objection):**
   - Replaced the native `<select>` scenario picker (rendered as a plain white browser popup, unfixable via CSS) with a fully custom HUD-styled listbox in `Console.tsx`.
   - Selecting Wind Misalignment/Cable Degradation "looked like nothing happened" — `LinkPanel`'s `Column` colored the badge *and* both Chain meters from one severity value, but those two faults only move `chainImbalanceDb`, never `linkQualityPct`. Added `chainImbalanceToSeverity` (`packages/dashboards/src/console/severity.ts`) so Chain 1/2 color independently from the column badge (5dB/8dB thresholds, the 5dB one field-confirmed from `windMisalignmentFault`'s own original design).

**4. Reworked Cable Degradation end-to-end (openspec change `cable-degradation-rework`, archived) after Robin gave a real, detailed T1 diagnostic answer that revealed the original mapping was wrong.** The old fault stepped `chainImbalanceDb` (RF chain/antenna field) — mechanically identical to Wind Misalignment, and never confirmed against real field experience. Real answer: "the cable" in fixed-wireless is the Ethernet/PoE run below the radio, not an RF path; it presents as negotiated-speed fallback and climbing CRC/FCS errors while RF stays completely clean. Rebuilt:
   - `ServiceLayerTelemetry.lanPort` gained `linkSpeedMbps`, `duplex`, `crcErrorCount`.
   - Removed the old RF-based `cableDegradationFault` from `faults.ts`; added a new same-named fault in `service-layer.ts` targeting the LAN port.
   - Cable Degradation moved from the radio-link bucket to the service-layer bucket in the scenario picker.
   - `ServiceLayerPanel` gained new rows and a "degraded" (warn) severity condition distinct from fully-down.
   - **Later correction, same session:** Robin shared two real airOS screenshots. One (healthy LiteBeam) showed a "Cable SNR" field I'd proposed adding to solve "how would a tech know 100 Mbps is abnormal" — but the second screenshot, a real suspected-degraded-cable ticket, showed Cable SNR *unchanged* (+30 dB, same as the healthy example) while duplex had fallen to **Half**, not Full as originally modeled. Flipped the fault's `duplex` override to `"half"` (a stronger, more self-explanatory tell than the raw Mbps number) and explicitly did **not** add Cable SNR — one observed case isn't a confirmed pattern, and it didn't move in the one case we have. This last duplex fix (`packages/simulation-engine/src/service-layer.ts`) is shipped but was done as a tiny direct fix, not its own openspec cycle.

**5. A real bug caught only by loading the app in a browser, not by any test:** typechecking `packages/dashboards` (`tsc --noEmit`) does **not** rebuild its `dist/`, which is what `apps/web` actually resolves against. The new ServiceLayerPanel rows/severity were invisible in the browser despite clean types, until an actual `pnpm --filter <pkg> build` ran. This had already bitten the project once before (documented in the 2026-09-23 handoff) and bit it again today — now saved as its own standing memory (`feedback_typecheck_not_build`), not just a one-off doc note.

## The open thread — read this before doing anything else

Robin is going through the entire fault catalog one-by-one in a separate claude.ai session, asking "how would a T1 tech determine X is wrong" for each fault, and getting detailed real-world diagnostic answers back. Two have been done so far (Cable Degradation — already fixed and shipped per #4 above; Wind Misalignment — **not yet fixed**, see below). **Robin is now compiling one long document covering the rest of the catalog** (Rain Fade, Foliage Growth, Interference at minimum) and will bring it to a **new session** to address in one pass, rather than continuing in this one.

**Wind Misalignment's real answer revealed a genuine architecture gap, not just a wrong-field mapping — and this is the reason the next session should NOT just patch faults one at a time:**

1. Real misalignment's *primary* signature is an overall signal (RSSI) **step down that stays down, with noise floor unchanged** — chain imbalance (from a dish twisting rather than swinging off-target) is real but secondary/corroborating. Today's `windMisalignmentFault` only steps `chainImbalanceDb` and never touches overall signal at all — it's missing the primary tell entirely.

2. **Bigger finding:** `noiseFloorDbm` is a hardcoded constant (`packages/simulation-engine/src/link-health.ts`: `-92 + jitter`) — it never moves for *any* fault, today. Robin's real diagnostic rule is explicit: "signal down + noise floor flat = misalignment/obstruction; signal flat + noise floor up = interference." Since noise floor can't move, today's `interferenceFault` (which degrades the same `linkHealth` scalar as Rain Fade and Foliage Growth) produces the *misalignment* signature, not the interference one — backwards from reality.

3. This traces directly back to a limitation flagged when `simulation-engine` was first designed (memory `project_noisefloor_console_pivot`, the `simulation-engine` entry): "the single-scalar model can't express 'good signal, bad airtime,' and this second axis is explicitly expected to be needed soon." This is the first concrete, real-world-confirmed case proving it's actually needed — not hypothetical anymore.

4. Smaller but real: true misalignment degrades **both LOCAL and REMOTE roughly equally** (the tower hears the CPE worse too), but the engine currently has no way to apply a fault symmetrically — LOCAL and REMOTE are two fully independent `simulateRadioLink` calls with no shared state, and the scenario picker's convention has been "radio-link faults apply to LOCAL only."

**Recommended approach, already discussed with Robin and not objected to:** don't fix Wind Misalignment alone. Wait for the compiled document covering the rest of the single-scalar-mechanism faults (Rain Fade, Foliage Growth, Interference all share this gap), then do **one** proper engine-architecture pass — likely adding a second independent axis (noise floor, or something broader) to `deriveLinkGroup`, deciding how each fault should split across that axis vs. `linkHealth` vs. chain imbalance, and deciding which faults need symmetric LOCAL+REMOTE application — informed by all the real answers at once, not patched fault-by-fault against the same core mechanism repeatedly.

**Service-layer faults (Expired Lease, Double NAT, Customer Router Offline, Wrong Boot Order) are lower priority for this review** — they already got real domain confirmation during their original design sessions (2026-09-22), unlike the radio-link faults which were flagged at the time as partially-unconfirmed guesses.

## Operational facts that will bite you if forgotten

- **Vercel (web) deploys are manual.** `git push` does NOT deploy `noisefloor.ca`. Run `vercel --prod` from the repo root after pushing.
- **`tsc --noEmit` on a workspace package does not update its `dist/`.** `apps/web` resolves `@noisefloor/dashboards` and `@noisefloor/simulation-engine` via their built `dist/`, not source. Always run the real `pnpm --filter <pkg> build` before trusting a dev-server/browser check against a package you just edited — see memory `feedback_typecheck_not_build` (bit this project twice now).
- Real Ubiquiti airOS screenshots Robin shared this session showed `LAN SPEED` as one combined field (`"1000 Mbps-Full"` / `"100 Mbps-Half"`), not two separate speed/duplex fields — a minor realism gap in `ServiceLayerPanel`'s current two-row layout, not yet addressed, low priority.

## What NOT to do without checking first

- Don't fix Wind Misalignment (or Rain Fade/Foliage Growth/Interference) as one-off patches — wait for Robin's compiled document and do one consolidated architecture pass. This was an explicit recommendation Robin didn't object to, not yet a hard rule, but treat it as the plan unless he says otherwise.
- Don't add a "Cable SNR" field to the LAN port model — proposed, then explicitly walked back same session because the one real example available showed it *not* moving on a suspected-degraded cable. Revisit only if Robin reports it moving on a real ticket.
- Don't touch `HudFloorNav`'s `position: fixed`, and don't re-raise the nav/content overlap cosmetic issue — both settled in the prior (2026-09-23) session, still standing.
- Continue treating "proceed"/an explicit answer to a design question as authorizing the build only — commit/push/deploy (and, this session, archive) each need their own separate explicit ask, every time.

## Suggested next step

**Read the document Robin brings at the start of the new session** (real T1 diagnostic answers for the remaining radio-link faults). Then, before writing any code: figure out the engine-architecture shape needed (the second axis, and which faults need it) across all the faults covered in that document at once, propose it properly via `openspec-propose` (this is squarely a `simulation-engine` capability change, likely also touching `radio-console-schema` if new fields are needed), get Robin's sign-off on the design, then implement. Do not start with Wind Misalignment alone.

## Where everything lives

- Current direction at a glance: `/README.md`
- Full narrative of every fault's design/confirmation history, including this session's findings: memory `project_noisefloor_console_pivot` (long, append-only) and `project_noisefloor_scenario_picker_design` (this session's detailed log — read this one first, it's the freshest and most relevant)
- The `tsc --noEmit` vs. `build` gotcha: memory `feedback_typecheck_not_build`
- Scenario picker: `apps/web/src/lib/console-scenarios.ts`, `apps/web/src/pages/Console.tsx`
- Radio-link faults: `packages/simulation-engine/src/faults.ts`; service-layer faults: `packages/simulation-engine/src/service-layer.ts`
- The core mechanism that needs the architecture pass: `packages/simulation-engine/src/link-health.ts`'s `deriveLinkGroup` (single `linkHealth` scalar → everything)
- Archived openspec changes from today: `openspec/changes/archive/2026-09-24-console-scenario-picker/`, `openspec/changes/archive/2026-09-24-cable-degradation-rework/`
