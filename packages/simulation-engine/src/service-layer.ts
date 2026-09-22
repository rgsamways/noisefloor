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
    },
  };
}

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
