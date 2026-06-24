import { experiencesDataAccess } from "@repo/db/database/admin";
import { zSearchExperiencesSchema } from "@repo/db/types";
import { z } from "zod";
import { adminProcedure, router } from "../../trpc";

export const adminExperiencesRouter = router({
  search: adminProcedure.input(zSearchExperiencesSchema).query(async ({ input }) => {
    return experiencesDataAccess.search(input);
  }),

  getById: adminProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    return experiencesDataAccess.getById(input.id);
  }),

  delete: adminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return experiencesDataAccess.delete(input.id);
  }),
});
