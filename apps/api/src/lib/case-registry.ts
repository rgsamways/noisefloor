import { caseOne } from "@noisefloor/cases";
import type { Case } from "@noisefloor/shared";

// Every case content module lives in packages/cases; this is the one place
// apps/api looks them up by slug or id. Grows to a real list once more
// cases exist — a single entry is enough for case-engine-minimal-playable.
const cases: Case[] = [caseOne];

export function listCases(): Case[] {
  return cases;
}

export function findCaseBySlug(slug: string): Case | undefined {
  return cases.find((c) => c.slug === slug);
}

export function findCaseById(id: string): Case | undefined {
  return cases.find((c) => c.id === id);
}
