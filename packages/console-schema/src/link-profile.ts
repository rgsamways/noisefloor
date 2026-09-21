import { z } from "zod";

// Context for judging whether a RadioLinkTelemetry reading is normal for
// *this* link, not a global constant (handoff §6.3) — shape only. This
// schema deliberately carries no logic that computes or classifies
// normalcy; that determination belongs to a later change (the simulation
// engine or a real normalizer), per design.md's Non-Goals.
//
// `band` and `gearClass` are free-form strings rather than a fixed enum:
// no enum values were reviewed or agreed on for this change, and inventing
// one here would bake an unstated assumption into the schema.
export const LinkProfileSchema = z.object({
  distanceKm: z.number(),
  band: z.string(),
  gearClass: z.string(),
});
export type LinkProfile = z.infer<typeof LinkProfileSchema>;
