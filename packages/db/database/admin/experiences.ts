import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";

import { db, slugifyText, generateUniqueString } from "../../index";
import { financeExperiences } from "../../schema";
import type { zCreateExperienceSchema, zSearchExperiencesSchema } from "../../types";

export const experiencesDataAccess = {
  search: async (params: typeof zSearchExperiencesSchema._type) => {
    const { query, page = 1, limit = 10, field, order, industry, articleType } = params;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (query) {
      conditions.push(
        or(
          like(financeExperiences.title, `%${query}%`),
          like(financeExperiences.organizationName, `%${query}%`),
          like(financeExperiences.authorName, `%${query}%`),
          like(financeExperiences.jobTitle, `%${query}%`),
        ),
      );
    }

    if (industry) {
      conditions.push(eq(financeExperiences.industry, industry));
    }

    if (articleType) {
      conditions.push(eq(financeExperiences.articleType, articleType));
    }

    const orderBy = [];
    if (field) {
      const orderDirection = order === "desc" ? desc : asc;
      if (field === "title") orderBy.push(orderDirection(financeExperiences.title));
      if (field === "publishTime") orderBy.push(orderDirection(financeExperiences.publishTime));
      if (field === "viewCount") orderBy.push(orderDirection(financeExperiences.viewCount));
      if (field === "likeCount") orderBy.push(orderDirection(financeExperiences.likeCount));
      if (field === "createdAt") orderBy.push(orderDirection(financeExperiences.createdAt));
    } else {
      orderBy.push(desc(financeExperiences.publishTime));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: financeExperiences.id,
        slug: financeExperiences.slug,
        title: financeExperiences.title,
        authorName: financeExperiences.authorName,
        organizationName: financeExperiences.organizationName,
        articleType: financeExperiences.articleType,
        jobTitle: financeExperiences.jobTitle,
        industry: financeExperiences.industry,
        viewCount: financeExperiences.viewCount,
        likeCount: financeExperiences.likeCount,
        commentCount: financeExperiences.commentCount,
        isPinned: financeExperiences.isPinned,
        isHot: financeExperiences.isHot,
        publishTime: financeExperiences.publishTime,
        lastEditedAt: financeExperiences.lastEditedAt,
        createdAt: financeExperiences.createdAt,
      })
      .from(financeExperiences)
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(financeExperiences)
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
    return db.query.financeExperiences.findFirst({
      where: eq(financeExperiences.id, id),
    });
  },

  delete: async (id: string) => {
    return db.delete(financeExperiences).where(eq(financeExperiences.id, id)).returning();
  },

  deleteMany: async (ids: string[]) => {
    if (ids.length === 0) return [];
    return db.delete(financeExperiences).where(inArray(financeExperiences.id, ids)).returning();
  },

  create: async (
    data: typeof zCreateExperienceSchema._type,
    opts: { userId: string; contentHtml: string }
  ) => {
    const baseSlug = slugifyText(data.title);
    const slug = baseSlug
      ? `${baseSlug}-${generateUniqueString(6).toLowerCase()}`
      : generateUniqueString(12).toLowerCase();

    const now = new Date();
    const [result] = await db
      .insert(financeExperiences)
      .values({
        slug,
        title: data.title,
        authorName: data.authorName || null,
        organizationName: data.organizationName || null,
        articleType: data.articleType || null,
        jobTitle: data.jobTitle || null,
        industry: data.industry || null,
        tags: data.tags?.length ? data.tags : null,
        summary: data.summary || null,
        markdownContent: data.markdownContent || null,
        contentHtml: opts.contentHtml || null,
        isPinned: data.isPinned ?? false,
        isHot: data.isHot ?? false,
        publishTime: now,
        authorUserId: opts.userId,
        lastEditedBy: opts.userId,
        lastEditedAt: now,
      })
      .returning();

    return result;
  },
};
