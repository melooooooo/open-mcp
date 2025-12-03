import { z } from "zod";
import { publicProcedure, router } from "../../trpc";

import { mcpAppsDataAccess, searchDataAccess } from "@repo/db/database/web";

export const mcpSearchRouter = router({
  searchApps: publicProcedure
    .input(
      z.object({
        appId: z.string().optional(),
        category: z.string().optional(),
        tag: z.string().optional(),
        limit: z.number().optional(),
        query: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const apps = await mcpAppsDataAccess.getAppsBySearch({
        appId: input.appId,
        limit: input.limit,
        category: input.category,
        tag: input.tag,
        query: input.query,
      })
      return apps;
    }),

  searchAll: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      return await searchDataAccess.searchAll(input.query);
    }),

  getAppById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { id } = input;
      // Mock data for demonstration
      const app = { id, name: `App ${id}` };
      return app;
    }),
});
