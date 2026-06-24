import { z } from "zod";

import { zSearchSchema } from "./common";

export const zSearchScrapedJobsSchema = zSearchSchema.extend({
  source: z.string().optional(),
  jobType: z.string().optional(),
});

export type ScrapedJobSearch = z.infer<typeof zSearchScrapedJobsSchema>;
