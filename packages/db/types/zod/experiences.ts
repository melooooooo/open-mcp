import { z } from "zod";
import { zSearchSchema } from "./common";

export const zSearchExperiencesSchema = zSearchSchema.extend({
  industry: z.string().optional(),
  articleType: z.string().optional(),
});

export const zCreateExperienceSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  authorName: z.string().optional(),
  organizationName: z.string().optional(),
  articleType: z.string().optional(),
  jobTitle: z.string().optional(),
  industry: z.string().optional(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
  markdownContent: z.string().optional(),
  isPinned: z.boolean().optional(),
  isHot: z.boolean().optional(),
});

export type SearchExperiences = z.infer<typeof zSearchExperiencesSchema>;
export type CreateExperience = z.infer<typeof zCreateExperienceSchema>;
