import { and, asc, desc, eq, exists, inArray, like, not, or, sql } from "drizzle-orm";
import { db } from "../../index";
import { zCreateAppSchema, zUpdateAppSchema, zSearchAppsSchema, zCreateRecommendationAppSchema } from "../../types";
import { user, user as users, apps, categories, appCategories, tags, appTags, repos, relatedApps, appRss, ads, suggestions, claims, recommendations, recommendationApps, rankingRecords, appSubmissions } from "../../schema";

// 应用程序数据访问模块
export const appsDataAccess = {
  // 创建应用程序
  create: async (data: typeof zCreateAppSchema._type, createdBy: string) => {
    return await db.transaction(async (tx) => {
      // 1. 验证唯一性约束
      const existing = await tx.query.apps.findFirst({
        where: or(
          and(eq(apps.name, data.name), eq(apps.type, data.type)),
          data.website ? eq(apps.website, data.website) : undefined,
          data.github ? eq(apps.github, data.github) : undefined
        ),
      });

      if (existing) {
        throw new Error("应用已存在");
      }

      // 2. 创建应用
      const [app] = await tx
        .insert(apps)
        .values({
          ...data,
          status: "pending",
          createdBy: createdBy,
          source: data?.source || "admin",
          publishStatus: data?.publishStatus || "offline",
          analysed: false,
          featured: false,
          stars: 0
        })
        .returning();

      if (!app) {
        throw new Error("应用创建失败");
      }

      // 3. 关联分类
      if (data.categoryIds?.length) {
        await tx.insert(appCategories).values(
          data.categoryIds.map((categoryId) => ({
            appId: app.id,
            categoryId,
          }))
        );

        for (const categoryId of data.categoryIds) {
          await tx.update(categories).set({
            appsCount: sql`apps_count + 1`
          }).where(eq(categories.id, categoryId));
        }
      }

      // 4. 关联标签
      if (data.tagIds?.length) {
        await tx.insert(appTags).values(
          data.tagIds.map((tagId) => ({
            appId: app.id,
            tagId,
          }))
        );
      }

      return app;
    });
  },

  createFromGitHub: async (data: {
    gitHubURL: string;
    slug: string;
    name: string;
    owner: string;
    description: string;
    type: "client" | "server" | "application";
    source: "automatic" | "submitted" | "admin";
    repoId: string;
    categoryId?: string;
  }, createdBy: string) => {
    return await db.transaction(async (tx) => {
      // 1. 验证唯一性约束
      const existing = await tx.query.apps.findFirst({
        where: or(
          and(eq(apps.name, data.name), eq(apps.type, data.type)),
          data.gitHubURL ? eq(apps.github, data.gitHubURL) : undefined
        ),
      });

      if (existing) {
        throw new Error("应用已存在");
      }

      // 2. 创建应用
      const [app] = await tx
        .insert(apps)
        .values({
          slug: data.slug,
          name: data.name,
          description: data.description,
          type: data.type,
          github: data.gitHubURL,
          repoId: data.repoId,
          categoryId: data.categoryId,
          status: "pending",
          createdBy: createdBy,
          source: data.source,
          publishStatus: "offline",
          analysed: false,
          featured: false,
          stars: 0
        })
        .returning();

      if (!app) {
        throw new Error("应用创建失败");
      }
      // 3. 创建仓库
      await tx.insert(repos).values({
        id: data.repoId,
        name: data.name,
        fullName: `${data.owner}/${data.name}`,
        owner: data.owner,
        owner_id: 0, //from github
        description: data.description,
        homepage: data.gitHubURL,
        stars: 0,
        forks: 0,
        watchers_count: 0,
        topics: [],
        pushed_at: new Date(),
        created_at: new Date(),
        last_commit: new Date(),
        commit_count: 0,
        contributor_count: 0,
        mentionable_users_count: 0,
      });
      return app;
    });
  },

  // 更新应用程序
  update: async (id: string, data: typeof zUpdateAppSchema._type, updatedBy: string) => {
    return await db
      .update(apps)
      .set({ ...data, updatedBy })
      .where(eq(apps.id, id))
      .returning();
  },

  //审核状态
  updateStatus: async (id: string, status: "pending" | "approved" | "rejected" | "archived") => {
    return await db.update(apps).set({ status }).where(eq(apps.id, id)).returning();
  },

  //上线/下线
  updatePublishStatus: async (id: string, status: "online" | "offline") => {
    return await db.update(apps).set({ publishStatus: status }).where(eq(apps.id, id)).returning();
  },
  // 获取应用程序
  getById: async (id: string) => {
    return await db.query.apps.findFirst({
      where: eq(apps.id, id),
      with: {
        tags: true,
        categories: true,
      },
    });
  },

  getByIdWithRelations: async (id: string) => {
    return await db.query.apps.findFirst({
      where: eq(apps.id, id),
      with: {
        tags: true,
        categories: true,
        suggestions: true,
        claims: true,
        owner: true,
        relatedApps: true,
        analysisHistory: true,
        rss: true,
      },
    });
  },

  // 搜索应用程序
  search: async (params: typeof zSearchAppsSchema._type) => {
    const { query, page = 1, limit = 10, field, order, type, status } = params;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = [];

    if (query) {
      conditions.push(or(like(apps.name, `%${query}%`), like(apps.description, `%${query}%`), like(apps.slug, `%${query}%`)));
    }

    if (type) {
      conditions.push(eq(apps.type, type));
    }

    if (status) {
      conditions.push(eq(apps.status, status));
    }

    // 构建排序条件
    const orderBy = [];
    if (field) {
      const orderDirection = order === "desc" ? desc : asc;
      if (field === "name") orderBy.push(orderDirection(apps.name));
      if (field === "slug") orderBy.push(orderDirection(apps.slug));
      if (field === "createdAt") orderBy.push(orderDirection(apps.createdAt));
      if (field === "updatedAt") orderBy.push(orderDirection(apps.updatedAt));
    } else {
      // 默认按创建时间倒序
      orderBy.push(desc(apps.createdAt));
    }

    // 执行查询
    const results = await db.query.apps.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy,
      limit,
      offset,
      with: {
        tags: true,
        categories: true,
      },
    });

    // 获取总数
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(apps)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = countResult[0]?.count ?? 0;

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

  // 删除应用程序
  delete: async (id: string) => {
    return await db.delete(apps).where(eq(apps.id, id)).returning();
  },

  // 获取相关应用
  getRelatedApps: async (id: string) => {
    const result = await db
      .select({
        id: apps.id,
        name: apps.name,
        description: apps.description,
        icon: apps.icon,
        similarity: relatedApps.similarity,
        stars: apps.stars,
        website: apps.website,
        github: apps.github,
      })
      .from(relatedApps)
      .innerJoin(apps, eq(apps.id, relatedApps.relatedAppId))
      .where(eq(relatedApps.appId, id));
    return result;
  },

  // 获取 RSS 订阅
  getRssFeeds: async (id: string) => {
    return await db.select().from(appRss).where(eq(appRss.appId, id));
  },

  // 获取广告
  getAds: async (id: string) => {
    return await db.select().from(ads).where(eq(ads.appId, id));
  },

  // 获取建议
  getSuggestions: async (id: string) => {
    return await db.select().from(suggestions).where(eq(suggestions.appId, id));
  },

  // 获取所有权声明
  getClaims: async (id: string) => {
    return await db.select().from(claims).where(eq(claims.appId, id));
  },

  // 获取所有者信息
  getOwner: async (id: string) => {
    const app = await db
      .select({
        ownerId: apps.ownerId,
      })
      .from(apps)
      .where(eq(apps.id, id));

    if (!app[0]?.ownerId) return null;

    const owner = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      })
      .from(user)
      .where(eq(user.id, app[0].ownerId));
    if (owner.length === 0) return null;
    const otherApps = await db
      .select({
        id: apps.id,
        name: apps.name,
      })
      .from(apps)
      .where(eq(apps.ownerId, app[0].ownerId));
    return {
      ...owner[0],
      otherApps: otherApps,
    };
  },

  // 获取推荐
  getRecommendations: async (id: string) => {
    return await db.select().from(recommendations).where(eq(recommendations.appId, id));
  },

  // 更新相关应用
  updateRelatedApps: async (id: string, relatedAppIds: string[]) => {
    return await db.transaction(async (tx) => {
      // 删除现有关系
      await tx.delete(relatedApps).where(eq(relatedApps.appId, id));

      // 添加新关系
      if (relatedAppIds.length > 0) {
        await tx.insert(relatedApps).values(
          relatedAppIds.map((relatedId) => ({
            appId: id,
            relatedAppId: relatedId,
            similarity: 1,
          }))
        );
      }
    });
  },

  // 更新 RSS 订阅
  updateRssFeeds: async (id: string, feeds: { title: string; feedUrl: string; description?: string }[]) => {
    return await db.transaction(async (tx) => {
      await tx.delete(appRss).where(eq(appRss.appId, id));

      if (feeds.length > 0) {
        await tx.insert(appRss).values(
          feeds.map((feed) => ({
            appId: id,
            ...feed,
          }))
        );
      }
    });
  },

  // 获取标签
  getTags: async (id: string) => {
    return await db.query.appTags.findMany({
      where: eq(appTags.appId, id),
      with: {
        tag: true,
      },
    });
  },

  // 获取分类
  getCategories: async (id: string) => {
    return await db.query.appCategories.findMany({
      where: eq(appCategories.appId, id),
      with: {
        category: true,
      },
    });
  },

  // 添加标签，用户选择了已有标签
  addTag: async (appId: string, tagId: string) => {
    const [tag] = await db.select().from(tags).where(and(eq(tags.id, tagId))).limit(1)
    if (tag) {
      const [result] = await db.insert(appTags).values({ appId, tagId }).returning();
      return result;
    }
    throw new Error("参数错误，标签不存在")
  },

  /**
   * 用户输入了新的标签
   * @param appId 
   * @param tagName 
   * @param slug 
   * @returns 
   */
  addNewTag: async (appId: string, tagName: string, slug: string) => {
    return await db.transaction(async (tx) => {
      const [tag] = await tx.insert(tags).values({ name: tagName, slug: slug, source: "admin" }).onConflictDoNothing().returning();
      if (tag && tag.id) {
        return await tx.insert(appTags).values({ appId, tagId: tag?.id }).returning();
      }
    });
  },

  // 添加分类
  addCategory: async (appId: string, categoryId: string) => {
    const [result] = await db.insert(appCategories).values({ appId, categoryId }).returning();
    return result;
  },

  // 移除标签
  removeTag: async (appId: string, tagId: string) => {
    await db.delete(appTags).where(and(eq(appTags.appId, appId), eq(appTags.id, tagId)));
  },

  // 移除分类
  removeCategory: async (appId: string, categoryId: string) => {
    await db.delete(appCategories).where(and(eq(appCategories.appId, appId), eq(appCategories.id, categoryId)));
  },

  // 更新标签
  updateTags: async (appId: string, tagIds: string[]) => {
    return await db.transaction(async (tx) => {
      // 删除现有标签
      await tx.delete(appTags)
        .where(eq(appTags.appId, appId));

      // 添加新标签
      if (tagIds.length > 0) {
        await tx.insert(appTags).values(
          tagIds.map(tagId => ({
            appId,
            tagId
          }))
        );
      }

      // 返回更新后的标签
      return tx.query.appTags.findMany({
        where: eq(appTags.appId, appId),
        with: {
          tag: true
        }
      });
    });
  },

  // 更新分类
  updateCategories: async (appId: string, categoryIds: string[]) => {
    return await db.transaction(async (tx) => {
      // 删除现有分类
      await tx.delete(appCategories)
        .where(eq(appCategories.appId, appId));

      // 添加新分类
      if (categoryIds.length > 0) {
        await tx.insert(appCategories).values(
          categoryIds.map(categoryId => ({
            appId,
            categoryId
          }))
        );
      }

      // 返回更新后的分类
      return tx.query.appCategories.findMany({
        where: eq(appCategories.appId, appId),
        with: {
          category: true
        }
      });
    });
  },

  // 获取提交
  getSubmission: async (id: string) => {
    const result = await db.select().from(appSubmissions).where(eq(appSubmissions.approvedAppId, id));
    return result ?? [];
  },

  // 更新提交
  updateSubmission: async (id: string, data: { status: "pending" | "approved" | "rejected" | "archived"; reason: string }) => {
    return await db.update(appSubmissions).set(data).where(eq(appSubmissions.id, id));
  },

  // 删除提交
  deleteSubmission: async (id: string) => {
    return await db.delete(appSubmissions).where(eq(appSubmissions.id, id));
  },

  // 拒绝声明
  rejectClaim: async (claimId: string, appId: string) => {
    return await db.update(claims).set({ status: "rejected" }).where(eq(claims.id, claimId)).returning();
  },

  // 批准声明
  approveClaim: async (claimId: string, appId: string) => {
    return await db.update(claims).set({ status: "approved" }).where(eq(claims.id, claimId)).returning();
  },

  // 搜索应用
  searchApps: async (query: string, page: number, limit: number) => {
    return await db.query.apps.findMany({
      where: like(apps.name, `%${query}%`),
      limit,
      offset: (page - 1) * limit,
    });
  },

  // 添加相关应用
  addRelatedApp: async (appId: string, relatedAppId: string) => {
    return await db.insert(relatedApps).values({ appId, relatedAppId });
  },

  // 移除相关应用
  removeRelatedApp: async (appId: string, relatedAppId: string) => {
    return await db.delete(relatedApps).where(and(eq(relatedApps.appId, appId), eq(relatedApps.relatedAppId, relatedAppId)));
  },

  // 添加推荐
  addRecommendation: async (data: typeof zCreateRecommendationAppSchema._type) => {
    return await db.insert(recommendationApps).values(data);
  },

  // 移除推荐
  removeRecommendation: async (id: string) => {
    return await db.delete(recommendationApps).where(
      eq(recommendations.id, id)
    );
  },


  // 获取用户提交的应用
  getSubmittedApps: async (userId: string) => {
    return await db.query.apps.findMany({
      where: eq(apps.userId, userId),
    });
  },

  // 获取用户提交的应用数量
  getSubmittedAppsCount: async (userId: string) => {
    const value = await db.select({ count: sql<number>`count(*)` }).from(apps).where(eq(apps.userId, userId));
    return value[0]?.count || 0;
  },

  // 获取应用数量
  getAppCountByUserId: async (userId: string) => {
    const value = await db.select({ count: sql<number>`count(*)` }).from(apps).where(eq(apps.userId, userId));
    return value[0]?.count || 0;
  },

  getByIds: async (ids: string[]) => {
    return await db.query.apps.findMany({
      where: inArray(apps.id, ids),
    });
  },
  searchByRecommendationId: async ({ query, recommendationId, limit = 20, page = 1 }: { query: string, recommendationId: string, limit?: number, page?: number }) => {
    const offset = (page - 1) * limit;
    const conditions = and(
      // eq(apps.status, "approved"),
      or(
        like(apps.name, `%${query}%`),
        like(apps.description, `%${query}%`),
        like(apps.slug, `%${query}%`) // 搜索应用名称、描述和 slug
      ),
      not(
        exists(
          db.select().from(recommendationApps)
            .where(and(
              eq(recommendationApps.recommendationId, recommendationId),
              eq(recommendationApps.appId, apps.id)
            ))
        )
      )

    )
    // 获取数据
    const results = await db.query.apps.findMany({
      where: conditions,
      limit,
      offset,
      orderBy: [desc(apps.createdAt)],
    });

    return {
      data: results,
    };
  },
  searchByRankingId: async ({ query, rankingId, limit = 20, page = 1 }: { query: string, rankingId: string, limit?: number, page?: number }) => {
    const offset = (page - 1) * limit;

    const conditions = and(
      // eq(apps.status, "approved"),
      or(
        like(apps.name, `%${query}%`),
        like(apps.description, `%${query}%`),
        like(apps.slug, `%${query}%`)
      ),
      not(
        exists(
          db.select().from(rankingRecords)
            .where(and(
              eq(rankingRecords.rankingId, rankingId),
              eq(rankingRecords.entityId, apps.id)
            ))
        )
      )
    );

    // 获取数据
    const results = await db.query.apps.findMany({
      where: conditions,
      limit,
      offset,
      orderBy: [desc(apps.createdAt)],
    });

    return {
      data: results,
    };
  },

  // 根据GitHub URL获取应用
  getByGitHubURL: async (gitHubURL: string) => {
    return await db.query.apps.findFirst({
      where: eq(apps.github, gitHubURL),
    });
  },
};

// 仓库数据访问模块
export const reposDataAccess = {
  // 创建仓库
  create: async (data: {
    id: string;
    name: string;
    fullName: string;
    owner: string;
    owner_id: number;
    description?: string;
    homepage?: string;
    stars?: number;
    forks?: number;
    watchers?: number;
    topics?: string[];
    pushed_at: Date;
    created_at: Date;
    last_commit?: Date;
    commit_count?: number;
    contributor_count?: number;
    mentionable_users_count?: number;
    watchers_count?: number;
    license_spdx_id?: string;
    pull_requests_count?: number;
    releases_count?: number;
    languages?: string[];
    open_graph_image_url?: string;
    uses_custom_open_graph_image?: boolean;
    latest_release_name?: string;
    latest_release_tag_name?: string;
    latest_release_published_at?: Date;
    latest_release_url?: string;
    latest_release_description?: string;
    readme_content?: string;
    readme_content_zh?: string;
    description_zh?: string;
    icon_url?: string;
    open_graph_image_oss_url?: string;
    latest_release_description_zh?: string;
  }) => {
    return await db.insert(repos).values({
      id: data.id,
      name: data.name,
      fullName: data.fullName,
      owner: data.owner,
      owner_id: data.owner_id,
      description: data.description,
      homepage: data.homepage,
      stars: data.stars, // 对应 stargazers_count
      forks: data.forks,
      topics: data.topics,
      pushed_at: data.pushed_at,
      created_at: data.created_at,
      last_commit: data.last_commit,
      commit_count: data.commit_count,
      contributor_count: data.contributor_count,
      mentionable_users_count: data.mentionable_users_count,
      watchers_count: data.watchers_count,
      license_spdx_id: data.license_spdx_id,
      pull_requests_count: data.pull_requests_count,
      releases_count: data.releases_count,
      languages: data.languages,
      open_graph_image_url: data.open_graph_image_url,
      uses_custom_open_graph_image: data.uses_custom_open_graph_image,
      latest_release_name: data.latest_release_name,
      latest_release_tag_name: data.latest_release_tag_name,
      latest_release_published_at: data.latest_release_published_at,
      latest_release_url: data.latest_release_url,
      latest_release_description: data.latest_release_description,
      readme_content: data.readme_content,
      readme_content_zh: data.readme_content_zh,
      description_zh: data.description_zh,
      icon_url: data.icon_url,
      open_graph_image_oss_url: data.open_graph_image_oss_url,
      latest_release_description_zh: data.latest_release_description_zh,
    }).returning();
  },

  // 根据ID获取仓库
  getById: async (id: string) => {
    return await db.query.repos.findFirst({
      where: eq(repos.id, id),
    });
  },

  // 根据fullName获取仓库
  getByFullName: async (fullName: string) => {
    return await db.query.repos.findFirst({
      where: eq(repos.fullName, fullName),
    });
  },

  // 更新仓库
  update: async (id: string, data: Partial<typeof repos.$inferInsert>) => {
    return await db.update(repos).set(data).where(eq(repos.id, id)).returning();
  },
};