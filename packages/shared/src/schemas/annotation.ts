import { z } from "zod";

// A callout anchored to a specific data point — used in debriefs and
// feedback to point at exactly the feature the evidence hinged on
// (NOISEFLOOR-OUTLINE.md §7 "Annotation mode"). `series` names a key into
// a World's `series` map; `t` matches one of that series' own point labels.
export const AnnotationSchema = z.object({
  target: z.object({
    series: z.string(),
    t: z.string(),
  }),
  label: z.string(),
});
export type Annotation = z.infer<typeof AnnotationSchema>;
