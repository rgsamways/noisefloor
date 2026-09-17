import { z } from "zod";

export const SeriesPointSchema = z.object({
  t: z.string(),
  v: z.number(),
});
export type SeriesPoint = z.infer<typeof SeriesPointSchema>;

export const SeriesGeneratorNameSchema = z.enum([
  "diurnalUsage",
  "noisyCeiling",
  "foliageYear",
  "shaperCollapse",
]);
export type SeriesGeneratorName = z.infer<typeof SeriesGeneratorNameSchema>;

// A SeriesRef is either inline points or a generator spec resolved at render
// time with a seeded RNG — see gen/resolve-series-ref.ts. `params` is
// intentionally loose here: each generator's own parameter type (gen/*.ts)
// is what case authors are checked against at authoring time in TypeScript,
// not at this schema's validation boundary.
export const SeriesRefSchema = z.union([
  z.array(SeriesPointSchema),
  z.object({
    gen: SeriesGeneratorNameSchema,
    params: z.record(z.string(), z.unknown()),
  }),
]);
export type SeriesRef = z.infer<typeof SeriesRefSchema>;

export const PinglogCellValueSchema = z.enum(["ok", "slow", "loss"]);
export type PinglogCellValue = z.infer<typeof PinglogCellValueSchema>;

export const PinglogGridSchema = z.object({
  days: z.number().int().positive(),
  bucketMinutes: z.number().int().positive(),
  grid: z.array(z.array(PinglogCellValueSchema)),
});
export type PinglogGrid = z.infer<typeof PinglogGridSchema>;

export const PinglogRefSchema = z.union([
  PinglogGridSchema,
  z.object({
    gen: z.literal("pinglogMonth"),
    params: z.record(z.string(), z.unknown()),
  }),
]);
export type PinglogRef = z.infer<typeof PinglogRefSchema>;
