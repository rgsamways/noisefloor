import { z } from "zod";

// Wraps every leaf telemetry field so staleness is independently derivable
// per field, not per panel — a real fault mode is "some fields are fresh,
// some are stale, and the panel has to show the difference" (handoff §4b).
// `asOf` is when this value was last read from the source, not when it was
// validated.
export function readingSchema<T extends z.ZodTypeAny>(valueSchema: T) {
  return z.object({
    value: valueSchema,
    asOf: z.iso.datetime(),
  });
}

export type Reading<T> = { value: T; asOf: string };
