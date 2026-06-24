import { z } from "zod";
import { zSearchSchema } from "./common";

export const zSearchExperiencesSchema = zSearchSchema.extend({
  industry: z.string().optional(),
  articleType: z.string().optional(),
});

export type SearchExperiences = z.infer<typeof zSearchExperiencesSchema>;
