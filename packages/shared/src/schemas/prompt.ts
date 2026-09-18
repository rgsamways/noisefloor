import { z } from "zod";

// Deliberately just `id`/`label` — no score or feedback here. Those live on
// Rubric (see rubric.ts) so that a Stage's Prompt is safe to send to the
// client before commit, while the Rubric never leaves the server
// (NOISEFLOOR-OUTLINE.md §11).
export const OptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});
export type Option = z.infer<typeof OptionSchema>;

export const PromptSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("hypothesis"),
    options: z.array(OptionSchema),
    allowFreeText: z.literal(true),
  }),
  z.object({
    kind: z.literal("nextCheck"),
    options: z.array(OptionSchema),
  }),
  z.object({
    kind: z.literal("whatChanged"),
    freeText: z.literal(true),
  }),
  z.object({
    kind: z.literal("customerMessage"),
    freeText: z.literal(true),
    minWords: z.number().int().positive(),
  }),
  z.object({
    kind: z.literal("ticketNote"),
    freeText: z.literal(true),
  }),
  z.object({
    kind: z.literal("action"),
    options: z.array(OptionSchema),
  }),
  // "What in this case doesn't hold together?" — the World is presented as
  // authoritative and the trainee has to spot a deliberately injected
  // inconsistency. Authoring this well requires the world-consistency
  // validator (NOISEFLOOR-AUTHORING-PLAN.md §4.3); the UI to author one is
  // later (Phase 6), this is just the schema-level hook.
  z.object({
    kind: z.literal("findTheFault"),
    freeText: z.literal(true),
  }),
]);
export type Prompt = z.infer<typeof PromptSchema>;
