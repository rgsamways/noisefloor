## Context

See proposal.md - Why. Relevant existing shapes:

```ts
// packages/console-schema/src/service-layer.ts
export const LanPortGroupSchema = z.object({
  linkUp: readingSchema(z.boolean()),
});

// packages/simulation-engine/src/service-layer.ts
export type ServiceLayerOverrides = {
  dhcpLeasePresent: boolean;
  leaseAddress: string;
  expectedAddress: string;
  natUpstreamPresent: boolean;
  natCustomerSidePresent: boolean;
  lanPortLinkUp: boolean;
};
export type ServiceLayerFault = { triggerAtSec: number; overrides: Partial<ServiceLayerOverrides> };
```

Faults here are discrete "from `triggerAtSec` onward, these fields read as given" overrides (`combineOverrides`) — no continuous ramp mechanism exists at the service-layer, unlike the radio-link engine's `faults.ts`. `ServiceLayerPanel`'s `serviceLayerSeverity` currently only checks `lanPort.linkUp` (down = bad) and the two NAT flags (both present = warn) — it has no notion of "up but degraded."

## Goals / Non-Goals

**Goals:**
- Make "Cable Degradation" actually model an Ethernet/PoE-run problem, per real T1 diagnostic practice: negotiated-speed fallback and climbing CRC errors, with RF fields completely unaffected.
- Keep the new fault consistent with the existing service-layer engine's discrete-override mechanism — no new time-signature machinery.
- Make the fault visible: new fields must actually render in `ServiceLayerPanel`, and the panel's severity must distinguish "degraded but connected" from both "healthy" and "fully down."

**Non-Goals:**
- Modeling live-incrementing/climbing counters over time — the engine has no continuous mechanism at the service layer, and building one just for this fault is out of scope (see Risks).
- Modeling MikroTik-style cable-test/TDR diagnostics (per-pair status, distance-to-fault) — that's an interactive tool a tech runs, not passive telemetry the console displays.
- The PoE-brownout/radio-reboot correlation (pairing this fault with low `baseUptimeSeconds` on the radio-link side, like Wrong Boot Order does) — a real and plausible extension, but deliberately deferred; see Risks.
- Any change to `LinkPanel`, `RadioLinkTelemetry`, or any other existing fault.

## Decisions

**New fields land on the existing `lanPort` group, not a new group.** `lanPort` already represents "physical-layer link state...on the radio's LAN-facing port" — exactly the same cable a T1 tech was describing. Alternative considered: a new top-level group — rejected as an unnecessary split of what's conceptually one thing (the state of one physical port).

**`crcErrorCount` is a fixed elevated value once triggered, not a live-climbing counter.** The service-layer engine's whole design is discrete overrides with no continuous math (unlike the radio-link engine's ramp/step/cycle shapes) — building a "climbing counter" mechanism would be new machinery for one field on one fault. A fixed nonzero count still teaches the correct lesson (errors are present and non-zero, distinct from the healthy `0`) without that cost. If a future fault needs genuine time-based growth, that's a bigger, separate design question.

**`duplex` is added to the schema but this fault doesn't change it (stays `"full"`).** The real-world detail Robin gave was two distinguishable severities — "100 Mbps, still full duplex" (the common, clearer tell) vs. "10 Mbps or half duplex" (worse, rarer) — and this change only builds the first. Adding the field now costs nothing and leaves room for a future, more severe fault variant to use it; inventing a second fault variant for this pass would be scope creep beyond what was asked.

**Healthy baseline: `linkSpeedMbps: 1000`, `duplex: "full"`, `crcErrorCount: 0`.** Matches modern gigabit-capable CPE gear, consistent with this project's existing "one plausible default, not configurable per-scenario yet" pattern (e.g. the 24-hour DHCP lease, the `169.254.x.x` self-assigned address). Fault override: `linkSpeedMbps: 100` (the exact number from Robin's own example ticket note, "radio negotiating 100/full"), `crcErrorCount` set to a clearly-nonzero value, `duplex` left at `"full"`.

**The new fault reuses the exported name `cableDegradationFault`, just moved from `faults.ts` to `service-layer.ts`.** Consumers (the scenario picker) import fault factories from `@noisefloor/simulation-engine`'s top-level barrel either way, so this is invisible to `apps/web` beyond which internal module defines it. Avoids inventing a new name (e.g. `degradedEthernetRunFault`) for what the picker and its scenario label both already call "Cable Degradation."

**`serviceLayerSeverity` gains a "degraded" (warn) condition for a LAN port that's up but below its healthy speed or showing errors**, distinct from its existing "down" (bad) condition for `!linkUp`. This is what makes the fix land correctly on the point that motivated this change: the *service* panel should visibly flag a problem (warn, not green) while the *radio-link* panel correctly stays clean — teaching that a real fault exists without incorrectly blaming the radio. Alternative considered: leave the SERVICE badge green too, relying only on the new detail rows — rejected because that reproduces the exact "looks like nothing happened" complaint that started this investigation, just moved to a different panel.

## Risks / Trade-offs

- **[Trade-off] A fixed error count instead of a genuinely climbing one is less realistic.** → Accepted: matches this engine's existing discrete-fault architecture; revisit only if a future fault has a real need for time-based growth that would justify the added mechanism for everyone, not just this one field.
- **[Risk] Skipping the PoE-brownout/reboot correlation leaves out a real, higher-severity variant of this same fault (radio browning out from voltage drop).** → Mitigation: none in this change; noted as a natural follow-up once this base version ships, using the same scenario-authoring convention Wrong Boot Order already established (pair a service-layer fault with a low `baseUptimeSeconds` on the radio-link side — no new engine mechanism needed).
- **[Risk] `crcErrorCount`'s exact healthy/faulted numbers are illustrative, not calibrated against real NRN hardware counters.** → Same category as this project's other documented "teaching convenience, not verified fact" choices (e.g. the self-assigned-address value); flagged here for the same reason, not blocking.
