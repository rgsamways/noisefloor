import { z } from "zod";

export const GotchaSchema = z.object({
  id: z.string(),
  title: z.string(),
  oneLiner: z.string(),
  explanation: z.string(),
  cases: z.array(z.string()).min(1),
});
export type Gotcha = z.infer<typeof GotchaSchema>;
