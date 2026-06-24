import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";

import { db } from "../../index";
import { scrapedJobs } from "../../job-schema";
import type { zSearchScrapedJobsSchema } from "../../types";

export const scrapedJobsDataAccess = {
  search: async (params: typeof zSearchScrapedJobsSchema._type) => {
    const { query, page = 1, limit = 10, field, order, source, jobType } = params;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (query) {
      conditions.push(
        or(
          like(scrapedJobs.title, `%${query}%`),
          like(scrapedJobs.author, `%${query}%`),
          like(scrapedJobs.companyName, `%${query}%`),
        ),
      );
    }

    if (source) {
      conditions.push(eq(scrapedJobs.source, source));
    }

    if (jobType) {
      conditions.push(eq(scrapedJobs.jobType, jobType));
    }

    const orderBy = [];
    if (field) {
      const orderDirection = order === "desc" ? desc : asc;
      if (field === "title") orderBy.push(orderDirection(scrapedJobs.title));
      if (field === "publishDate") orderBy.push(orderDirection(scrapedJobs.publishDate));
      if (field === "createdAt") orderBy.push(orderDirection(scrapedJobs.createdAt));
      if (field === "replyCount") orderBy.push(orderDirection(scrapedJobs.replyCount));
    } else {
      orderBy.push(desc(scrapedJobs.createdAt));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select()
      .from(scrapedJobs)
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(scrapedJobs)
      .where(whereClause);

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

  deleteMany: async (ids: string[]) => {
    if (ids.length === 0) return [];
    return db.delete(scrapedJobs).where(inArray(scrapedJobs.id, ids)).returning();
  },
};
