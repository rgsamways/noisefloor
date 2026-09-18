import type { World } from "../../schemas/world.js";
import { CHAIN_IMBALANCE_THRESHOLD_DB } from "../constants.js";
import type { Tension } from "../types.js";

function chainImbalance(chains: readonly [number, number]): number {
  return Math.abs(chains[0] - chains[1]);
}

// See spec.md: the distance/frequency expected-signal check is descoped —
// World has no TX power or antenna gain to compute it from.
export function checkRfLinkBudget(world: World): Tension[] {
  const tensions: Tension[] = [];
  const { link } = world;

  const localImbalance = chainImbalance(link.chainsLocal);
  if (localImbalance > CHAIN_IMBALANCE_THRESHOLD_DB) {
    tensions.push({
      rule: "rf.chain-imbalance",
      severity: "soft",
      fields: ["link.chainsLocal"],
      message: `Local chains differ by ${localImbalance.toFixed(1)} dB, more than the ${CHAIN_IMBALANCE_THRESHOLD_DB} dB expected for a well-aligned link. That usually means off-axis alignment or a partial obstruction — worth a stated cause.`,
      resolutions: [
        { description: "Narrow the gap between the two chain values", field: "link.chainsLocal" },
        { description: "Note a cause (obstruction, polarization, alignment) in the case narrative" },
      ],
    });
  }

  const remoteImbalance = chainImbalance(link.chainsRemote);
  if (remoteImbalance > CHAIN_IMBALANCE_THRESHOLD_DB) {
    tensions.push({
      rule: "rf.chain-imbalance",
      severity: "soft",
      fields: ["link.chainsRemote"],
      message: `Remote chains differ by ${remoteImbalance.toFixed(1)} dB, more than the ${CHAIN_IMBALANCE_THRESHOLD_DB} dB expected for a well-aligned link. That usually means off-axis alignment or a partial obstruction — worth a stated cause.`,
      resolutions: [
        { description: "Narrow the gap between the two chain values", field: "link.chainsRemote" },
        { description: "Note a cause (obstruction, polarization, alignment) in the case narrative" },
      ],
    });
  }

  return tensions;
}
