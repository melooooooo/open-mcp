import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "../../index";
import { scrapedJobs } from "../../schema";
import type { zSearchReferralsSchema } from "../../types";

export const referralsDataAccess = {
  search: async (params: typeof zSearchReferralsSchema._type) => {
    const { query, page = 1, limit = 10, field, order, source } = params;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (query) {
      conditions.push(
        or(
          like(scrapedJobs.title, `%${query}%`),
          like(scrapedJobs.companyName, `%${query}%`),
          like(scrapedJobs.author, `%${query}%`)
        )
      );
    }
    if (source) {
      conditions.push(eq(scrapedJobs.source, source));
    }

    const orderBy = [];
    if (field) {
      const orderDirection = order === "desc" ? desc : asc;
      if (field === "title") orderBy.push(orderDirection(scrapedJobs.title));
      if (field === "publishDate") orderBy.push(orderDirection(scrapedJobs.publishDate));
      if (field === "createdAt") orderBy.push(orderDirection(scrapedJobs.createdAt));
      if (field === "updatedAt") orderBy.push(orderDirection(scrapedJobs.updatedAt));
    } else {
      orderBy.push(desc(scrapedJobs.createdAt));
    }

    const results = await db.query.scrapedJobs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy,
      limit,
      offset,
    });

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(scrapedJobs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count ?? 0);

    return {
      data: results,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getById: async (id: string) => {
    return db.query.scrapedJobs.findFirst({
      where: eq(scrapedJobs.id, id),
    });
  },

  delete: async (id: string) => {
    return db.delete(scrapedJobs).where(eq(scrapedJobs.id, id)).returning();
  },
};
