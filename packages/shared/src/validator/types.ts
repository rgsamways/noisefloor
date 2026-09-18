import { z } from "zod";

export const SeveritySchema = z.enum(["hard", "soft"]);
export type Severity = z.infer<typeof SeveritySchema>;

// Descriptive only, not executable — see design.md "Tension.resolutions is
// descriptive data, not code". A future builder UI can render `description`
// and offer to set `field` to `suggestedValue`, but nothing here applies
// the fix itself.
export const ResolutionSchema = z.object({
  description: z.string(),
  field: z.string().optional(),
  suggestedValue: z.unknown().optional(),
});
export type Resolution = z.infer<typeof ResolutionSchema>;

export const AcknowledgementSchema = z.object({
  reason: z.string(),
  by: z.string(),
  at: z.string(),
});
export type Acknowledgement = z.infer<typeof AcknowledgementSchema>;

export const TensionSchema = z.object({
  rule: z.string(),
  severity: SeveritySchema,
  fields: z.array(z.string()),
  message: z.string(),
  resolutions: z.array(ResolutionSchema).min(1),
  acknowledged: AcknowledgementSchema.optional(),
});
export type Tension = z.infer<typeof TensionSchema>;
