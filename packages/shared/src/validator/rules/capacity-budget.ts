import type { World } from "../../schemas/world.js";
import {
  CAPACITY_BAND_HARD_LOW_MULTIPLIER,
  CAPACITY_BAND_HARD_MULTIPLIER,
  CAPACITY_BAND_SOFT_LOW_MULTIPLIER,
  CAPACITY_BAND_SOFT_MULTIPLIER,
  MBPS_PER_MHZ_FOR_RATE,
} from "../constants.js";
import type { Tension } from "../types.js";

function checkDirection(
  direction: "capacityDownMbps" | "capacityUpMbps",
  actualMbps: number,
  rate: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
  widthMHz: number,
): Tension | null {
  const reference = MBPS_PER_MHZ_FOR_RATE[rate] * widthMHz;
  const ratio = actualMbps / reference;

  if (ratio > CAPACITY_BAND_HARD_MULTIPLIER || ratio < CAPACITY_BAND_HARD_LOW_MULTIPLIER) {
    return {
      rule: "capacity.outside-achievable-band",
      severity: "hard",
      fields: [`link.${direction}`],
      message: `${actualMbps} Mbps at ${widthMHz} MHz / rate ${rate}X is nowhere near the roughly ${reference.toFixed(0)} Mbps this combination can achieve. Something in width, rate, or capacity doesn't belong here.`,
      resolutions: [
        { description: "Adjust capacity to a plausible value for this width/rate", field: `link.${direction}` },
        { description: "Adjust the modulation rate or channel width instead" },
      ],
    };
  }

  if (ratio > CAPACITY_BAND_SOFT_MULTIPLIER || ratio < CAPACITY_BAND_SOFT_LOW_MULTIPLIER) {
    return {
      rule: "capacity.unusual-for-band",
      severity: "soft",
      fields: [`link.${direction}`],
      message: `${actualMbps} Mbps is a stretch for ${widthMHz} MHz / rate ${rate}X (reference is roughly ${reference.toFixed(0)} Mbps). Plausible with a TDD share favoring this direction, but worth a stated reason.`,
      resolutions: [{ description: "Note the TDD share or other cause behind the asymmetry" }],
    };
  }

  return null;
}

export function checkCapacityBudget(world: World): Tension[] {
  const { link, site } = world;
  const tensions: Tension[] = [];

  const down = checkDirection("capacityDownMbps", link.capacityDownMbps, link.rateLocal, site.widthMHz);
  if (down) tensions.push(down);

  const up = checkDirection("capacityUpMbps", link.capacityUpMbps, link.rateRemote, site.widthMHz);
  if (up) tensions.push(up);

  return tensions;
}
