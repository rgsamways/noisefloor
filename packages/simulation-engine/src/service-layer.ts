import type { ServiceLayerTelemetry } from "@noisefloor/console-schema";
import { readingAt } from "./reading.js";

// Confirmed common at NRN: "i believe most are 24hr" — the healthy-baseline
// lease renews on this cycle rather than sitting at one number forever.
const LEASE_DURATION_SEC = 86400;

const EXPECTED_ADDRESS = "10.20.4.17"; // static simulated customer WAN address
const MANAGEMENT_IP = "10.20.4.1";
const GATEWAY = "10.20.4.254";

// Teaching-convenience convention, not a verified behavior of NRN's actual
// customer-premises gear (Sagemcom, TP-Link HX220) — see design.md. Chosen
// because it matches the handoff doc's own phrasing ("self-assigned a
// useless address") and gives trainees an unambiguous, learnable signal.
const SELF_ASSIGNED_ADDRESS = "169.254.23.91";

export type ServiceLayerOverrides = {
  dhcpLeasePresent: boolean;
  leaseAddress: string;
  expectedAddress: string;
  natUpstreamPresent: boolean;
  natCustomerSidePresent: boolean;
  lanPortLinkUp: boolean;
  lanPortLinkSpeedMbps: number;
  lanPortDuplex: "full" | "half";
  lanPortCrcErrorCount: number;
};

export type ServiceLayerFault = {
  triggerAtSec: number;
  overrides: Partial<ServiceLayerOverrides>;
};

export type ServiceLayerScenario = {
  faults?: ServiceLayerFault[];
};

export type ServiceLayerConfig = {
  baseTimeIso: string;
  scenario?: ServiceLayerScenario;
};

// Faults are discrete "from triggerAtSec onward, these fields read as
// given" overrides — no ramp/hold/recover math, unlike the radio-link
// engine's faults.ts. Multiple active faults apply in trigger order, with
// a later-triggered fault winning on any field both touch.
function combineOverrides(faults: readonly ServiceLayerFault[], atSec: number): Partial<ServiceLayerOverrides> {
  const active = [...faults].filter((f) => atSec >= f.triggerAtSec).sort((a, b) => a.triggerAtSec - b.triggerAtSec);
  let combined: Partial<ServiceLayerOverrides> = {};
  for (const fault of active) combined = { ...combined, ...fault.overrides };
  return combined;
}

export function simulateServiceLayer(config: ServiceLayerConfig, atSec: number): ServiceLayerTelemetry {
  const faults = config.scenario?.faults ?? [];
  const overrides = combineOverrides(faults, atSec);

  const cyclePos = ((atSec % LEASE_DURATION_SEC) + LEASE_DURATION_SEC) % LEASE_DURATION_SEC;
  const remainingSeconds = LEASE_DURATION_SEC - cyclePos;
  const issuedAtSec = atSec - cyclePos;
  const issuedAtIso = new Date(new Date(config.baseTimeIso).getTime() + issuedAtSec * 1000).toISOString();

  const dhcpLeasePresent = overrides.dhcpLeasePresent ?? true;
  const expectedAddress = overrides.expectedAddress ?? EXPECTED_ADDRESS;
  const leaseAddress = overrides.leaseAddress ?? (dhcpLeasePresent ? expectedAddress : SELF_ASSIGNED_ADDRESS);
  // Confirmed common case: most customers have radios set to router mode,
  // meaning the radio itself is what does customer-side NAT.
  const natUpstreamPresent = overrides.natUpstreamPresent ?? false;
  const natCustomerSidePresent = overrides.natCustomerSidePresent ?? true;
  const lanPortLinkUp = overrides.lanPortLinkUp ?? true;
  // Healthy defaults match modern gigabit-capable CPE gear with a clean run.
  const lanPortLinkSpeedMbps = overrides.lanPortLinkSpeedMbps ?? 1000;
  const lanPortDuplex = overrides.lanPortDuplex ?? "full";
  const lanPortCrcErrorCount = overrides.lanPortCrcErrorCount ?? 0;

  const reading = <T>(value: T) => readingAt(value, config.baseTimeIso, atSec);

  return {
    dhcpLease: {
      present: reading(dhcpLeasePresent),
      issuedAt: reading(issuedAtIso),
      remainingSeconds: reading(dhcpLeasePresent ? remainingSeconds : 0),
      leaseAddress: reading(leaseAddress),
      expectedAddress: reading(expectedAddress),
    },
    addressing: {
      managementIp: reading(MANAGEMENT_IP),
      gateway: reading(GATEWAY),
      wanAddress: reading(expectedAddress),
    },
    nat: {
      upstreamPresent: reading(natUpstreamPresent),
      customerSidePresent: reading(natCustomerSidePresent),
    },
    lanPort: {
      linkUp: reading(lanPortLinkUp),
      linkSpeedMbps: reading(lanPortLinkSpeedMbps),
      duplex: reading(lanPortDuplex),
      crcErrorCount: reading(lanPortCrcErrorCount),
    },
  };
}

// Same effect as wrongBootOrderFault below — kept as separate named
// functions, not one alias, since they're expected to diverge if this
// engine ever grows repair-action modeling (this fault's fix isn't order-
// sensitive; wrongBootOrderFault's specifically is).
export function expiredLeaseFault(triggerAtSec: number): ServiceLayerFault {
  return {
    triggerAtSec,
    overrides: { dhcpLeasePresent: false, leaseAddress: SELF_ASSIGNED_ADDRESS },
  };
}

export function doubleNatFault(triggerAtSec: number): ServiceLayerFault {
  return {
    triggerAtSec,
    overrides: { natUpstreamPresent: true, natCustomerSidePresent: true },
  };
}

// Applies only to the minority topology where a genuinely separate
// downstream router sits behind a bridged radio — a router sharing the
// radio's own power supply would go down together with it, which is
// already covered by the existing far-end-drop staleness pattern, not
// this fault. Touches only lanPortLinkUp, not dhcpLease/addressing/nat.
export function customerRouterOfflineFault(triggerAtSec: number): ServiceLayerFault {
  return {
    triggerAtSec,
    overrides: { lanPortLinkUp: false },
  };
}

// Field-confirmed: "the cable" in fixed-wireless is the Ethernet/PoE run
// from the radio down to the injector and router, not an RF path — a
// degrading run falls back to a lower negotiated speed (the classic tell:
// still full duplex, just slower) and shows climbing CRC/FCS errors, while
// the link itself stays up and every RF field stays clean. crcErrorCount
// is a fixed elevated value once triggered, not a live-climbing counter —
// this engine's discrete-override mechanism has no continuous math (see
// design.md's Risks); a fixed nonzero count still teaches "errors are
// present," just not their growth over time.
export function cableDegradationFault(triggerAtSec: number): ServiceLayerFault {
  return {
    triggerAtSec,
    overrides: { lanPortLinkSpeedMbps: 100, lanPortCrcErrorCount: 480 },
  };
}

// Same override as expiredLeaseFault above — this engine has never modeled
// repair actions for any fault, so there's no boot *race* to simulate at
// runtime, only the resulting broken-lease state. The diagnostic signature
// ("radio green, customer down") comes from pairing this with a scenario
// that also gives the paired simulateRadioLink call a small
// baseUptimeSeconds at/around this same triggerAtSec, so the radio panel
// shows a recent reboot correlating with a service layer that never
// recovered — that correlation is what a trainee learns to read, not a
// labeled cause field. No code coupling between the two simulate
// functions is needed to represent that; it's a scenario-authoring
// convention, not a mechanism.
export function wrongBootOrderFault(triggerAtSec: number): ServiceLayerFault {
  return {
    triggerAtSec,
    overrides: { dhcpLeasePresent: false, leaseAddress: SELF_ASSIGNED_ADDRESS },
  };
}
