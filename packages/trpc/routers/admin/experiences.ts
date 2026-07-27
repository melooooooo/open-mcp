import { experiencesDataAccess } from "@repo/db/database/admin";
import { zCreateExperienceSchema, zSearchExperiencesSchema } from "@repo/db/types";
import { z } from "zod";
import { markdownToCanonicalHtml } from "../../common/experience-content";
import { adminProcedure, router } from "../../trpc";

export const adminExperiencesRouter = router({
  search: adminProcedure.input(zSearchExperiencesSchema).query(async ({ input }) => {
    return experiencesDataAccess.search(input);
  }),

  getById: adminProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    return experiencesDataAccess.getById(input.id);
  }),

  create: adminProcedure.input(zCreateExperienceSchema).mutation(async ({ ctx, input }) => {
    const contentHtml = input.markdownContent
      ? await markdownToCanonicalHtml(input.markdownContent)
      : "";

    return experiencesDataAccess.create(input, {
      userId: ctx.user.id,
      contentHtml,
    });
  }),

  delete: adminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return experiencesDataAccess.delete(input.id);
  }),
});
