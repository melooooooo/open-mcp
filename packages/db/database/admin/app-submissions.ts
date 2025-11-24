import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "../../index";
import { user } from "../../schema";
import { zCreateAppSubmissionSchema, zUpdateAppSubmissionSchema, zSearchAppSubmissionsSchema, CreateAppSubmission } from "../../types";

export const appSubmissionData = {
  // 创建应用提交，只有用户才会创建，管理员不会创建，只会更新
  create: async (data: typeof zCreateAppSubmissionSchema._type) => {
    const [result] = await db.insert(appSubmissions).values({
      userId: data.userId,
      status: data.status ?? "pending",
      name: data.name ?? "",
      description: data.description ?? "",
      longDescription: data.longDescription ?? "",
      type: data.type ?? "default",
      website: data.website ?? "",
      github: data.github ?? "",
      docs: data.docs ?? "",
      favicon: data.favicon ?? "",
      logo: data.logo ?? "",
    }).returning();
    return result;
  },

  updateAppSubmission: async (id: string, data: { description: string, longDescription: string }) => {
    return await db.update(appSubmissions).set({ description: data.description }).where(eq(appSubmissions.id, id)).returning();
  },

  // 更新应用提交
  update: async (data: typeof zUpdateAppSubmissionSchema._type) => {
    const { id, ...updateData } = data;
    return await db
      .update(appSubmissions)
      .set(updateData)
      .where(eq(appSubmissions.id, id))
      .returning();
  },

  // 获取应用提交
  getById: async (id: string) => {
    const [result] = await db
      .select()
      .from(appSubmissions)
      .where(eq(appSubmissions.id, id));
    return result;
  },

  getByIdWithUser: async (id: string) => {
    return await db
      .query.appSubmissions.findFirst({
        where: (appSubmissions, { eq }) => eq(appSubmissions.id, id),
        with: {
          user: true,
          approvedApp: true,
        },
      })
  },
  // 搜索应用提交
  search: async (data: typeof zSearchAppSubmissionsSchema._type) => {
    const {
      page = 1,
      limit = 10,
      field = "createdAt",
      order = "desc",
      appId,
      userId,
      status
    } = data;

    const offset = (page - 1) * limit;

    const baseQuery = db
      .select({
        submission: appSubmissions,
        user: users
      })
      .from(appSubmissions)
      .leftJoin(users, eq(appSubmissions.userId, users.id));

    // 构建where条件
    const conditions = [];

    if (appId) {
      conditions.push(eq(appSubmissions.approvedAppId, appId));
    }
    if (userId) {
      conditions.push(eq(appSubmissions.userId, userId));
    }
    if (status) {
      conditions.push(eq(appSubmissions.status, status));
    }

    // 应用所有条件
    const finalQuery = conditions.length > 0
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    // 添加排序和分页
    const query = finalQuery.limit(limit).offset(offset);

    // 获取总数
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(appSubmissions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = countResult[0]?.count ?? 0;

    // 根据字段名添加排序
    let results;
    switch (field) {
      case "createdAt":
        results = await query.orderBy(order === "desc" ? desc(appSubmissions.createdAt) : asc(appSubmissions.createdAt));
        break;
      case "updatedAt":
        results = await query.orderBy(order === "desc" ? desc(appSubmissions.updatedAt) : asc(appSubmissions.updatedAt));
        break;
      case "status":
        results = await query.orderBy(order === "desc" ? desc(appSubmissions.status) : asc(appSubmissions.status));
        break;
      default:
        results = await query.orderBy(desc(appSubmissions.createdAt));
    }

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

  // 删除应用提交
  delete: async (id: string) => {
    return await db
      .delete(appSubmissions)
      .where(eq(appSubmissions.id, id))
      .returning();
  },

  // Approve submission and create app
  approve: async (data: { id: string; slug: string; type: string; categoryId: string; approvedBy: string }) => {
    return await db.transaction(async (tx) => {
      // 1. Get submission
      const submission = await tx.query.appSubmissions.findFirst({
        where: eq(appSubmissions.id, data.id)
      });

      if (!submission) {
        throw new Error("找不到该提交");
      }

      // 2. Create app
      const [app] = await tx.insert(apps).values({
        // @ts-expect-error
        slug: data.slug,
        name: submission.name,
        description: submission.description,
        longDescription: submission.longDescription,
        type: data.type,
        website: submission.website || "",
        github: submission.github || "",
        docs: submission.docs || "",
        favicon: submission.favicon || "",
        logo: submission.logo || "",
        status: "active",
        source: "submission",
        publishStatus: "published",
        analysed: false,
        featured: false,
        stars: 0,
        createdBy: submission.userId
      }).returning();

      if (!app) {
        throw new Error("应用创建失败");
      }

      // 3. Create category relationship
      await tx.insert(appCategories).values({
        appId: app.id,
        categoryId: data.categoryId
      });

      // 4. Update submission status
      await tx.update(appSubmissions)
        .set({
          status: "approved",
          approvedAppId: app.id,
          approvedAt: new Date(),
          approvedBy: data.approvedBy,
        })
        .where(eq(appSubmissions.id, data.id));

      return { app, submission };
    });
  },

  // 拒绝应用提交
  reject: async (id: string, reason: string) => {
    return await db
      .update(appSubmissions)
      .set({ status: "rejected", rejectionReason: reason })
      .where(eq(appSubmissions.id, id))
      .returning();
  },

  /**
   * 获取用户提交的应用
   * @param userId 用户ID
   * @returns 用户提交的应用
   */
  getSubmissionsByUserId: async (userId: string) => {
    return await db.query.appSubmissions.findMany({
      where: (appSubmissions, { eq }) => eq(appSubmissions.userId, userId),
      with: {
        approvedApp: true,
      },
    });
  },

  getSubmittedAppsCount: async (userId: string) => {
    const count = await db.select({
      count: sql<number>`count(*)`
    })
      .from(appSubmissions)
      .where(eq(appSubmissions.userId, userId));
    return count[0]?.count ?? 0;
  },

  createGithubAppSubmission: async (data: CreateAppSubmission[]) => {
    const validSubmissions: CreateAppSubmission[] = [];

    // 逐个检查每个提交
    for (const submission of data) {
      if (!submission.github) {
        validSubmissions.push(submission);
        continue;
      }

      // 检查 app_submissions 表是否存在
      const existingSubmission = await db
        .select()
        .from(appSubmissions)
        .where(eq(appSubmissions.github, submission.github))
        .limit(1);

      if (existingSubmission.length > 0) {
        continue;
      }

      // 检查 apps 表是否存在
      const existingApp = await db
        .select()
        .from(apps)
        .where(eq(apps.github, submission.github))
        .limit(1);

      if (existingApp.length > 0) {
        continue;
      }

      validSubmissions.push(submission);
    }

    // 如果没有有效提交，返回空数组
    if (validSubmissions.length === 0) {
      return [];
    }

    // 创建有效的提交
    const result = await db
      .insert(appSubmissions)
      .values(validSubmissions.map(item => ({
        userId: item.userId,
        status: item.status,
        name: item.name ?? '',
        description: item.description ?? '',
        longDescription: item.longDescription ?? '',
        type: item.type,
        website: item.website ?? '',
        github: item.github ?? '',
        docs: item.docs ?? '',
        favicon: item.favicon ?? '',
        logo: item.logo ?? ''
      })))
      .onConflictDoNothing()
      .returning();

    return result;
  }
};
