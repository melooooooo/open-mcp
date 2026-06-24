import { referralsDataAccess } from "@repo/db/database/admin";
import { zSearchReferralsSchema } from "@repo/db/types";
import { z } from "zod";
import { adminProcedure, router } from "../../trpc";

export const referralsRouter = router({
  search: adminProcedure.input(zSearchReferralsSchema).query(async ({ input }) => {
    return referralsDataAccess.search(input);
  }),

  getById: adminProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    return referralsDataAccess.getById(input.id);
  }),

  delete: adminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return referralsDataAccess.delete(input.id);
  }),
});
