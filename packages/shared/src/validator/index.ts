import type { World } from "../schemas/world.js";
import { checkCapacityBudget } from "./rules/capacity-budget.js";
import { checkEventCoherence } from "./rules/event-coherence.js";
import { checkRfLinkBudget } from "./rules/rf-link-budget.js";
import { checkShaperThroughput } from "./rules/shaper-throughput.js";
import { checkSnrModulation } from "./rules/snr-modulation.js";
import type { Tension } from "./types.js";

export * from "./types.js";
export * from "./constants.js";

// `seed` resolves any generator-backed SeriesRefs in `world.series` the
// same way a dashboard would — pass the case's own id/seed so results are
// deterministic and match what the case actually renders.
export function validateWorld(world: World, seed: string | number): Tension[] {
  return [
    ...checkRfLinkBudget(world),
    ...checkSnrModulation(world),
    ...checkCapacityBudget(world),
    ...checkShaperThroughput(world, seed),
    ...checkEventCoherence(world, seed),
  ];
}
