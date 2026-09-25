import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { entities } from "../db/permissions-schema.js";

export type EodReportMode = "freeform" | "structured";

// Resolves the one entity row's eodReportMode — the same "the one
// entity" resolution admin.ts's own resolveEntityId does, needed here
// too since both admin.ts (the settings route) and eod-reports.ts
// (deciding a new report's mode) read/write this same site-wide
// setting. See openspec/changes/archive/add-eod-report-modes design.md's
// Decision 1.
export async function getEodReportMode(): Promise<EodReportMode> {
  const [entity] = await db.select({ eodReportMode: entities.eodReportMode }).from(entities).limit(1);
  if (!entity) throw new Error("no entity seeded");
  return entity.eodReportMode;
}

export async function setEodReportMode(mode: EodReportMode): Promise<void> {
  const [entity] = await db.select({ id: entities.id }).from(entities).limit(1);
  if (!entity) throw new Error("no entity seeded");
  await db.update(entities).set({ eodReportMode: mode, updatedAt: new Date() }).where(eq(entities.id, entity.id));
}
