import { z } from "zod";
import { RadioLinkTelemetrySchema, ServiceLayerTelemetrySchema } from "@noisefloor/console-schema";

// Build-time-only: derives every valid `relatedFields` path from the real
// console-schema shapes, so an article can't reference a field that
// doesn't exist (design.md's Decision 2). Dotted `group.field` form —
// e.g. "link.snrDb", "lanPort.crcErrorCount" — matches the two levels
// both RadioLinkTelemetry and ServiceLayerTelemetry actually have: a
// top-level group, then reading-wrapped ({value, asOf}) leaf fields.
// `console-schema` is a devDependency of this package (like gray-matter)
// and is never re-exported from index.ts, so it stays out of the browser
// bundle that consumes @noisefloor/kb.

function isReadingShape(schema: unknown): boolean {
  if (!(schema instanceof z.ZodObject)) return false;
  const shape = schema.shape as Record<string, unknown>;
  return "value" in shape && "asOf" in shape;
}

function derivePaths(rootSchema: z.ZodObject<z.ZodRawShape>): string[] {
  const paths: string[] = [];
  for (const [groupKey, groupSchema] of Object.entries(rootSchema.shape)) {
    if (!(groupSchema instanceof z.ZodObject)) continue; // e.g. RadioLinkTelemetry's vendorExtras (z.record)
    for (const [fieldKey, fieldSchema] of Object.entries(groupSchema.shape as Record<string, unknown>)) {
      if (isReadingShape(fieldSchema)) paths.push(`${groupKey}.${fieldKey}`);
    }
  }
  return paths;
}

export const VALID_RELATED_FIELD_PATHS: ReadonlySet<string> = new Set([
  ...derivePaths(RadioLinkTelemetrySchema),
  ...derivePaths(ServiceLayerTelemetrySchema),
]);

export function isValidRelatedField(path: string): boolean {
  return VALID_RELATED_FIELD_PATHS.has(path);
}
