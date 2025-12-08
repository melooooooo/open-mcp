
import { siteFeedbacks } from "@repo/db/mcp-schema";
import { zCreateSiteFeedback } from "@repo/db/types";
import { db } from "@repo/db";

import { publicProcedure, router } from "../../trpc";

export const siteFeedbacksRouter = router({
  create: publicProcedure
    .input(zCreateSiteFeedback)
    .mutation(async ({ input }) => {
      console.log("[site-feedback] [create] input", input);
      return db.insert(siteFeedbacks).values(input);
    }),
});
