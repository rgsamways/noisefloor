// A tiny seeded PRNG (mulberry32) — deterministic, dependency-free. Same
// pattern as the parked case-study package's packages/shared/src/gen/rng.ts,
// reimplemented here rather than imported from it (see design.md: this
// change does not depend on parked code, only its algorithmic precedent).
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromString(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

export function createRng(seed: string | number): () => number {
  const numericSeed = typeof seed === "string" ? seedFromString(seed) : seed;
  return mulberry32(numericSeed);
}

// [-1, 1] jitter scaled by `amount`, drawn from the given rng.
export function jitter(rng: () => number, amount: number): number {
  return (rng() * 2 - 1) * amount;
}
