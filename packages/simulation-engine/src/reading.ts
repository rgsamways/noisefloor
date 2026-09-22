import type { Reading } from "@noisefloor/console-schema";

// Builds a Reading<T> whose `asOf` is `baseTimeIso` advanced by `atSec`
// simulated seconds — the engine's only notion of "wall clock" is this
// offset from a scenario's start time.
export function readingAt<T>(value: T, baseTimeIso: string, atSec: number): Reading<T> {
  const asOf = new Date(new Date(baseTimeIso).getTime() + atSec * 1000).toISOString();
  return { value, asOf };
}
