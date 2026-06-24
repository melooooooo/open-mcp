import { z } from "zod";
import { zSearchSchema } from "./common";

export const zSearchReferralsSchema = zSearchSchema.extend({
  source: z.string().optional(),
});

export type SearchReferrals = z.infer<typeof zSearchReferralsSchema>;
