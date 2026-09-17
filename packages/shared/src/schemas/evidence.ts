import { z } from "zod";

// "device" is included alongside the outline's original three families
// (crm/radio/nms) per PROJECT-PLAN.md decision D9 — a GDMS-style
// device/profile-management portal, scoped for Phase 5's dashboard
// components but harmless to allow in the schema now.
export const DashboardFamilySchema = z.enum(["crm", "radio", "nms", "device"]);
export type DashboardFamily = z.infer<typeof DashboardFamilySchema>;

export const ColleagueRoleSchema = z.enum(["T1", "T2", "field"]);
export type ColleagueRole = z.infer<typeof ColleagueRoleSchema>;

export const EvidenceSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("dashboard"),
    family: DashboardFamilySchema,
    view: z.string(),
    worldSlice: z.string().optional(),
    annotate: z.boolean().optional(),
  }),
  z.object({
    kind: z.literal("customerSays"),
    text: z.string(),
  }),
  z.object({
    kind: z.literal("ticketNote"),
    author: z.string(),
    text: z.string(),
    at: z.string(),
  }),
  z.object({
    kind: z.literal("colleagueSays"),
    role: ColleagueRoleSchema,
    text: z.string(),
  }),
]);
export type Evidence = z.infer<typeof EvidenceSchema>;
