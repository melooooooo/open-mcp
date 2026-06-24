import { scrapedJobsDataAccess } from "@repo/db/database/admin";
import { zSearchScrapedJobsSchema } from "@repo/db/types";
import { z } from "zod";

import { adminProcedure, router } from "../../trpc";

export const scrapedJobsRouter = router({
  search: adminProcedure
    .input(zSearchScrapedJobsSchema)
    .query(async ({ input }) => {
      return scrapedJobsDataAccess.search(input);
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return scrapedJobsDataAccess.getById(input.id);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return scrapedJobsDataAccess.delete(input.id);
    }),

  deleteMany: adminProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).min(1) }))
    .mutation(async ({ input }) => {
      return scrapedJobsDataAccess.deleteMany(input.ids);
    }),
});
