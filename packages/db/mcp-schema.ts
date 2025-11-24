import { createId } from "@paralleldrive/cuid2"
import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// Better Auth 基础用户表导入为 users，便于复用现有关系命名
import { user as users } from "./auth-schema";

export const rolesEnumArray = ["user", "admin", "member"] as const;

// 活动表 - 用户活动记录
export const activities = pgTable("activities", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // package, deploy, update, delete
  resourceId: text("resource_id"), // 相关资源ID
  resourceType: varchar("resource_type", { length: 50 }), // model, repository, service
  resourceName: varchar("resource_name", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull(), // completed, failed, in-progress
  details: jsonb("details"),
  summary: varchar("summary"),
  link: varchar("link", { length: 255 }).notNull(),
  startTime: timestamp("start_time", { mode: "date" }).defaultNow().notNull(),
  endTime: timestamp("end_time", { mode: "date" }),
  duration: varchar("duration", { length: 50 }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("activities_user_id_idx").on(table.userId),
]);

// 应用类型枚举

// 应用表，每个应用只有一个分类，不采用多分类机制，
export const apps = pgTable(
  "apps",
  {
    id: text("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => createId()),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    categoryId: text("category_id"),  // 分类Id
    description: text("description").notNull(),
    descriptionZh: text("description_zh"), // 从github上拉取的readme中的内容，中文
    longDescription: text("long_description"), //概要介绍的内容
    readme: text("readme"), // 从github上拉取的readme中的内容
    readmeZh: text("readme_zh"), // 从github上拉取的readme中的内容，中文
    type: varchar("type", { length: 20, enum: ["client", "server", "application"] }).notNull(),
    deployable: boolean("deployable").default(false), //是否可以部署为服务
    source: varchar("source", { length: 20, enum: ["automatic", "submitted", "admin"] }).notNull(), // automatic, submitted, admin，即自动，提交，管理员录入
    status: varchar("status", { length: 20, enum: ["pending", "approved", "rejected", "archived"] }).notNull(), // pending, approved, rejected, archived
    publishStatus: varchar("publish_status", { length: 20, enum: ["online", "offline"] }).notNull(), // online, offline
    analysed: boolean("analysed").notNull().default(false), //是否处理过，即是否分析过
    icon: text("icon"),
    banner: varchar("banner", { length: 255 }),
    pics: text("pics").array(), // 图片列表
    website: text("website"),
    github: text("github"),
    docs: text("docs"),
    version: varchar("version", { length: 50 }),
    license: varchar("license", { length: 255 }),
    stars: integer("stars").default(0),
    featured: boolean("featured").notNull().default(false),
    scenario: varchar("scenario", { length: 50 }),
    forks: integer("forks").default(0),
    watchers: integer("watchers").default(0),
    primaryLanguage: varchar("primary_language", { length: 200 }), // 主要语言
    languages: text("languages").array(), // 语言列表
    commits: integer("commits").default(0),
    releases: integer("releases").default(0),
    issues: integer("issues").default(0),
    pullRequests: integer("pull_requests").default(0),
    contributors: integer("contributors").default(0),
    lastCommit: timestamp("last_commit", { mode: "date" }),
    supportedServers: text("supported_servers").array(),
    features: text("features").array(),
    tools: jsonb("tools"),
    ownerId: text("owner_id"), // 应用的所有者，即声称应用的人，并且被批准了
    userId: text("user_id"), //应用的提交人，即submission 的userid
    ownerName: varchar("owner_name", { length: 255 }),
    verified: boolean("verified").default(false),
    deleted: boolean("deleted").default(false),
    createdBy: varchar("created_by", { length: 255 }),
    updatedBy: varchar("updated_by", { length: 255 }),
    repoCreatedAt: timestamp("repo_created_at", { mode: "date" }), // 仓库创建时间，即仓库在github的创建时间
    repoId: text("repo_id"), // 仓库ID，用于关联仓库，如果为空，则表示没有仓库
    publishedAt: timestamp("published_at", { mode: "date" }),
    lastAnalyzedAt: timestamp("last_analyzed_at", { mode: "date" }), // 上次分析时间
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(), // 创建时间，即添加到数据库的时间，用于记录应用的添加时间 
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(), // 更新时间
  },
  (table) => [index("apps_slug_idx").on(table.slug),
  index("apps_type_idx").on(table.type),
  index("apps_owner_id_idx").on(table.ownerId),
  uniqueIndex("apps_name_type_unique_idx").on(table.name, table.type),
  uniqueIndex("apps_website_idx").on(table.website),
  uniqueIndex("apps_github_idx").on(table.github)]
);

// 标签表
export const tags = pgTable("tags", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  name: varchar("name", { length: 255 }).notNull().unique(),
  source: varchar("source", { length: 20, enum: ["ai", "user", "admin"] }).notNull(), // ai, user, admin
  description: text("description"),
  type: varchar("type", { length: 20, enum: ["client", "server", "application", "all"] }).default("all"), // client, server, application
  totalApps: integer("total_apps").default(0),
  deleted: boolean("deleted").default(false),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  createdBy: text("created_by"),
  deletedBy: text("deleted_by"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("tags_slug_idx").on(table.slug),
  uniqueIndex("tags_name_source_unique_idx").on(table.name),
]);

// 应用标签关联表
export const appTags = pgTable("app_tags", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  appId: text("app_id").notNull(),
  tagId: text("tag_id").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("app_tags_app_id_idx").on(table.appId),
  index("app_tags_tag_id_idx").on(table.tagId),
  uniqueIndex("app_tags_unique_idx").on(table.appId, table.tagId),
]);

// 分类表
export const categories = pgTable("categories", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  parentId: text("parent_id"),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  appsCount: integer("apps_count").default(0),
  icon: text("icon"),
  status: varchar("status", { length: 20, enum: ["offline", "online"] }).notNull().default("offline"), // offline, online
  deleted: boolean("deleted").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("categories_slug_idx").on(table.slug),
]);

// 应用分类关联表
export const appCategories = pgTable("app_categories", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  appId: text("app_id").notNull(),
  categoryId: text("category_id").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("app_categories_app_id_idx").on(table.appId),
  index("app_categories_category_id_idx").on(table.categoryId),
  uniqueIndex("app_categories_unique_idx").on(table.appId, table.categoryId),
]);

// 建议表
export const suggestions = pgTable(
  "suggestions",
  {
    id: text("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => createId()),
    appId: text("app_id").notNull(),
    appName: varchar("app_name", { length: 255 }).notNull(),
    appSlug: varchar("app_slug", { length: 255 }).notNull(),
    appType: varchar("app_type", { length: 20, enum: ["client", "server", "application"] }).notNull(),
    userId: text("user_id")
      .notNull(),
    userName: varchar("user_name", { length: 255 }).notNull(),
    userEmail: varchar("user_email", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    type: varchar("type", { length: 20, enum: ["feature", "bug", "improvement", "other"] }).notNull(),
    status: varchar("status", { length: 20, enum: ["pending", "reviewing", "accepted", "implemented", "rejected", "duplicate"] })
      .notNull()
      .default("pending"),
    upvotes: integer("upvotes").default(0),
    priority: varchar("priority", { length: 20 }),
    reproducible: boolean("reproducible"),
    stepsToReproduce: text("steps_to_reproduce"),
    expectedBehavior: text("expected_behavior"),
    actualBehavior: text("actual_behavior"),
    attachmentUrl: text("attachment_url"),
    responseText: text("response_text"),
    responseUserId: text("response_user_id"),
    responseUserName: varchar("response_user_name", { length: 255 }),
    responseAt: timestamp("response_at", { mode: "date" }),
    implementedAt: timestamp("implemented_at", { mode: "date" }),
    imageUrl: text("image_url"),
    adminRemarks: text("admin_remarks"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("suggestions_app_id_idx").on(table.appId), index("suggestions_user_id_idx").on(table.userId), index("suggestions_status_idx").on(table.status)]
);

// 所有权请求状态枚举

// 所有权请求表
export const claims = pgTable(
  "claims",
  {
    id: text("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => createId()),
    appId: text("app_id")
      .notNull(),
    userId: text("user_id")
      .notNull(),
    userName: varchar("user_name", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }),
    userEmail: varchar("user_email", { length: 255 }).notNull(),
    appName: varchar("app_name", { length: 255 }).notNull(),
    appSlug: varchar("app_slug", { length: 255 }).notNull(),
    reason: text("reason"),
    appType: varchar("app_type", { length: 20, enum: ["client", "server", "application"] }).notNull(),
    appIcon: text("app_icon"),
    proofUrl: text("proof_url").notNull(),
    proofType: varchar("proof_type", { length: 20 }).notNull(),
    additionalInfo: text("additional_info"),
    status: varchar("status", { length: 20, enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
    reviewedAt: timestamp("reviewed_at", { mode: "date" }),
    reviewedBy: text("reviewed_by"),
    updatedBy: text("updated_by"),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("ownership_requests_app_id_idx").on(table.appId), index("ownership_requests_user_id_idx").on(table.userId), index("ownership_requests_status_idx").on(table.status)]
);

// 广告表
export const ads = pgTable("ads", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  userId: text("user_id").notNull(),
  type: varchar("type", { length: 20, enum: ["listing", "banner"] }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  imageUrl: text("image_url"),
  placement: varchar("placement", { enum: ["top", "middle", "bottom"] }).notNull().default("bottom"),
  startDate: timestamp("start_date", { mode: "date" }).notNull(),
  endDate: timestamp("end_date", { mode: "date" }).notNull(),
  status: varchar("status", { length: 20, enum: ["pending", "active", "completed", "rejected", "paused"] }).notNull().default("pending"),
  price: real("price").notNull().default(0),
  budget: real("budget").notNull(),
  spent: real("spent").notNull().default(0),
  cpc: real("cpc").notNull().default(0),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  ctr: real("ctr").default(0),
  appId: text("app_id"),
  approvedAt: timestamp("approved_at", { mode: "date" }),
  approvedBy: text("approved_by"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("ads_user_id_idx").on(table.userId),
  index("ads_status_idx").on(table.status),
  index("ads_dates_idx").on(table.startDate, table.endDate),
]);

// 支付表
export const payments = pgTable(
  "payments",
  {
    id: text("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull(),
    type: varchar("type", { length: 20, enum: ["ad", "subscription", "service", "other"] }).notNull(),
    relatedId: text("related_id"),
    amount: real("amount").notNull(),
    currency: varchar("currency", { length: 10 }).default("CNY"),
    method: varchar("method", { length: 20, enum: ["wechat", "alipay", "bank_transfer"] }).notNull(),
    status: varchar("status", { length: 20, enum: ["pending", "completed", "failed", "refunded"] }).notNull().default("pending"),
    transactionId: text("transaction_id"),
    invoiceNumber: text("invoice_number"),
    completedAt: timestamp("completed_at", { mode: "date" }),
    refundedAt: timestamp("refunded_at", { mode: "date" }),
    refundReason: text("refund_reason"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("payments_user_id_idx").on(table.userId), index("payments_status_idx").on(table.status), index("payments_type_idx").on(table.type)]
);

// 发票表
export const invoices = pgTable("invoices", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  userId: text("user_id").notNull(),
  paymentId: text("payment_id").notNull(),
  type: varchar("type", { length: 20, enum: ["personal", "company"] }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  taxNumber: varchar("tax_number", { length: 255 }),
  address: text("address"),
  email: varchar("email", { length: 255 }).notNull(),
  status: varchar("status", { length: 20, enum: ["pending", "issued", "sent"] }).notNull().default("pending"),
  issuedAt: timestamp("issued_at", { mode: "date" }),
  sentAt: timestamp("sent_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("invoices_user_id_idx").on(table.userId),
  index("invoices_payment_id_idx").on(table.paymentId),
  index("invoices_status_idx").on(table.status),
]);

export const tagsRelations = relations(tags, ({ many }) => ({
  appTags: many(appTags),
}))

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  appCategories: many(appCategories),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
}))

export const appTagsRelations = relations(appTags, ({ one }) => ({
  app: one(apps, {
    fields: [appTags.appId],
    references: [apps.id],
  }),
  tag: one(tags, {
    fields: [appTags.tagId],
    references: [tags.id],
  }),
}))

export const appCategoriesRelations = relations(appCategories, ({ one }) => ({
  app: one(apps, {
    fields: [appCategories.appId],
    references: [apps.id],
  }),
  category: one(categories, {
    fields: [appCategories.categoryId],
    references: [categories.id],
  }),
}))

export const suggestionsRelations = relations(suggestions, ({ one }) => ({
  app: one(apps, {
    fields: [suggestions.appId],
    references: [apps.id],
  }),
  submitter: one(users, {
    fields: [suggestions.userId],
    references: [users.id],
  }),
  responseUser: one(users, {
    fields: [suggestions.responseUserId],
    references: [users.id],
  }),
}));

export const claimsRelations = relations(claims, ({ one }) => ({
  app: one(apps, {
    fields: [claims.appId],
    references: [apps.id],
  }),
  user: one(users, {
    fields: [claims.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [claims.reviewedBy],
    references: [users.id],
  }),
}))

export const adsRelations = relations(ads, ({ one }) => ({
  user: one(users, {
    fields: [ads.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [ads.approvedBy],
    references: [users.id],
  }),
  app: one(apps, {
    fields: [ads.appId],
    references: [apps.id],
  }),
}))

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  invoices: many(invoices),
}))

export const invoicesRelations = relations(invoices, ({ one }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  payment: one(payments, {
    fields: [invoices.paymentId],
    references: [payments.id],
  }),
}))

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}))

// 推荐应用表，首页展示时使用，即推荐应用，也可以为每个分类设置推荐应用或者排行
// 分类推荐：category，即在分类列表中显示的体检列表
// rank：是排行推荐，即各种日/周/月等的排行或者product hunt排行等等
// app相关的推荐不在这里维护，在relatedApp表中维护
export const recommendations = pgTable("recommendations", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  categoryId: text("category_id"), // 如果type === "category"，则此值肯定不为空。
  appId: text("app_id"), // 如果type === "app"，则此值不能为空
  type: varchar("type", { length: 20, enum: ["rank", "popular", "new", "related", "category"] }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  appCount: integer("app_count").notNull().default(0),
  status: varchar("status", { length: 20, enum: ["pending", "active"] }).notNull().default("pending"),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("recommendations_type_idx").on(table.type),
]);

// 分类推荐应用关联表
export const recommendationApps = pgTable("recommendation_apps", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  recommendationId: text("recommendation_id").notNull(), // 推荐ID
  appId: text("app_id").notNull(), // 应用ID
  order: integer("order").notNull().default(0), // 排序
  status: varchar("status", { length: 20, enum: ["pending", "active"] }).notNull().default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("recommendation_apps_app_id_idx").on(table.appId),
  uniqueIndex("recommendation_apps_unique_idx").on(table.recommendationId, table.appId),
]);

// 相关应用表，即应用之间的关系表，在详情页中使用和展示
// 其他分类，排行等等推荐信息在recommendation表中维护
export const relatedApps = pgTable("related_apps", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  appId: text("app_id").notNull(),
  type: varchar("type", { length: 20, enum: ["similar", "related"] }).default("related").notNull(),
  relatedAppId: text("related_app_id").notNull(),
  similarity: real("similarity").default(0), // 相似度分数
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("related_apps_app_id_idx").on(table.appId),
  index("related_apps_related_app_id_idx").on(table.relatedAppId),
  uniqueIndex("related_apps_unique_idx").on(table.appId, table.relatedAppId),
]);

// 应用分析历史记录表
export const appAnalysisHistory = pgTable("app_analysis_history", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()), //此即为jobId
  type: varchar("type", { length: 20, enum: ["website", "github"] }).notNull(),
  appId: text("app_id").notNull(),
  url: text("url").notNull(), // 分析的url
  version: varchar("version", { length: 50 }),
  analysisResult: jsonb("analysis_result").notNull(), // 分析结果
  features: text("features").array(), // 提取的特征
  tools: jsonb("tools"), // 提取的工具
  readme: text("readme"), // 提取的readme，优先取中文
  tags: text("tags").array(), // 提取的标签
  categories: text("categories").array(), // 提取的分类
  status: varchar("status", { length: 50, enum: ["pending", "in_progress", "completed", "stopped", "failed"] }).notNull().default("pending"), // 分析状态
  message: text("message"), // 分析消息
  error: text("error"), // 错误信息
  startTime: timestamp("start_time", { mode: "date" }).defaultNow().notNull(),
  endTime: timestamp("end_time", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("app_analysis_history_app_id_idx").on(table.appId),
  index("app_analysis_history_status_idx").on(table.status),
]);

// 用户邮件订阅表
export const emailSubscriptions = pgTable("email_subscriptions", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  userId: text("user_id"),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }), // 用户姓名
  referringSite: varchar("referring_site", { length: 255 }), // 来源网站，头信息中获取
  utmSource: varchar("utm_source", { length: 255 }).default("openmcp"),
  utmMedium: varchar("utm_medium").default("subscribe_form"),
  utmCampaign: varchar("utm_campaign").default("organic"),

  preferences: jsonb("preferences").default({}), // 订阅偏好
  isVerified: boolean("is_verified").default(false),
  verificationToken: text("verification_token"),
  verificationExpires: timestamp("verification_expires", { mode: "date" }),
  lastEmailSent: timestamp("last_email_sent", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("email_subscriptions_user_id_idx").on(table.userId),
  index("email_subscriptions_email_idx").on(table.email),
]);

// 应用RSS表
export const appRss = pgTable("app_rss", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  appId: text("app_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  feedUrl: text("feed_url").notNull(),
  lastFetched: timestamp("last_fetched", { mode: "date" }),
  lastUpdated: timestamp("last_updated", { mode: "date" }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("app_rss_app_id_idx").on(table.appId),
  uniqueIndex("app_rss_feed_url_idx").on(table.feedUrl),
]);

// RSS条目表
export const rssItems = pgTable("rss_items", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  rssId: text("rss_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content"),
  link: text("link").notNull(),
  guid: text("guid").notNull(),
  pubDate: timestamp("pub_date", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("rss_items_rss_id_idx").on(table.rssId),
  index("rss_items_pub_date_idx").on(table.pubDate),
  uniqueIndex("rss_items_guid_idx").on(table.guid),
]);

// 应用提交状态枚举

// 用户应用提交表
export const appSubmissions = pgTable("app_submissions", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  userId: text("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  longDescription: text("long_description"), // 长描述 在抓取之后更新
  type: varchar("type", { length: 20, enum: ["client", "server", "application"] }).notNull(),
  website: text("website"),
  github: text("github"),
  docs: text("docs"),       // readme文档，在抓取之后更新
  favicon: text("favicon"), //应用图标
  logo: text("logo"), //应用logo
  appId: text("app_id"), // 应用Id，认证通过之后，会生成appid
  version: varchar("version", { length: 50 }), // 版本号 在抓取之后更新
  license: varchar("license", { length: 255 }), // 许可证 在抓取之后更新
  scenario: varchar("scenario", { length: 50 }), // 应用场景 在抓取之后更新
  features: text("features").array(), // 应用特点 在抓取之后更新
  tags: text("tags").array(), // 应用标签 v在抓取之后更新
  status: varchar("status", { length: 20, enum: ["pending", "approved", "rejected", "archived"] }).notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  reviewedAt: timestamp("reviewed_at", { mode: "date" }),
  reviewedBy: text("reviewed_by"),
  approvedAppId: text("approved_app_id"),
  approvedAt: timestamp("approved_at", { mode: "date" }),
  approvedBy: text("approved_by"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("app_submissions_user_id_idx").on(table.userId),
  index("app_submissions_status_idx").on(table.status),
  index("app_submissions_reviewed_by_idx").on(table.reviewedBy),
  index("app_submissions_approved_app_id_idx").on(table.approvedAppId),
]);

// 添加关系定义
export const recommendationsRelations = relations(recommendations, ({ one, many }) => ({
  category: one(categories, {
    fields: [recommendations.categoryId],
    references: [categories.id],
  }),
  apps: many(recommendationApps),
}));

export const recommendationAppsRelations = relations(recommendationApps, ({ one }) => ({
  app: one(apps, {
    fields: [recommendationApps.appId],
    references: [apps.id],
  }),
  recommendation: one(recommendations, {
    fields: [recommendationApps.recommendationId],
    references: [recommendations.id],
  }),
}));

export const relatedAppsRelations = relations(relatedApps, ({ one }) => ({
  app: one(apps, {
    fields: [relatedApps.appId],
    references: [apps.id],
  }),
  relatedApp: one(apps, {
    fields: [relatedApps.relatedAppId],
    references: [apps.id],
  }),
}));

export const appAnalysisHistoryRelations = relations(appAnalysisHistory, ({ one }) => ({
  app: one(apps, {
    fields: [appAnalysisHistory.appId],
    references: [apps.id],
  }),
}));

export const emailSubscriptionsRelations = relations(emailSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [emailSubscriptions.userId],
    references: [users.id],
  }),
}));

export const appRssRelations = relations(appRss, ({ one, many }) => ({
  app: one(apps, {
    fields: [appRss.appId],
    references: [apps.id],
  }),
  items: many(rssItems),
}));

export const rssItemsRelations = relations(rssItems, ({ one }) => ({
  rss: one(appRss, {
    fields: [rssItems.rssId],
    references: [appRss.id],
  }),
}));

export const appSubmissionsRelations = relations(appSubmissions, ({ one }) => ({
  user: one(users, {
    fields: [appSubmissions.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [appSubmissions.reviewedBy],
    references: [users.id],
  }),
  approvedApp: one(apps, {
    fields: [appSubmissions.approvedAppId],
    references: [apps.id],
  }),
}));

// 更新应用关系
export const appsRelations = relations(apps, ({ many, one }) => ({
  tags: many(appTags),
  categories: many(appCategories),
  suggestions: many(suggestions),
  claims: many(claims),
  category: one(categories, {
    fields: [apps.categoryId],
    references: [categories.id],
  }),
  owner: one(users, {
    fields: [apps.ownerId],
    references: [users.id],
  }),
  relatedApps: many(relatedApps, { relationName: "app" }),
  relatedToApps: many(relatedApps, { relationName: "relatedApp" }),
  analysisHistory: many(appAnalysisHistory),
  rss: many(appRss),
  approvedSubmissions: many(appSubmissions, { relationName: "approvedApp" }),
}))

// 资产表
export const assets = pgTable("assets", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  userId: text("user_id").notNull(),
  assetType: varchar("asset_type", { length: 20, enum: ["unknown", "avatar", "banner", "icon", "logo", "image", "document"] }).notNull(),
  contentType: varchar("content_type", { length: 255 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  url: text("url"),
  bookmarkId: text("bookmark_id"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("assets_user_id_idx").on(table.userId),
  index("assets_asset_type_idx").on(table.assetType),
  index("assets_bookmark_id_idx").on(table.bookmarkId),
]);

// 资产关系
export const assetsRelations = relations(assets, ({ one }) => ({
  user: one(users, {
    fields: [assets.userId],
    references: [users.id],
  }),
}));

/**
 * 排行表，用于存储排行数据。
 */
export const rankings = pgTable("rankings", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  name: varchar("name", { length: 100 }).notNull(),
  source: varchar("source", { length: 100, enum: ["github", "openmcp", "producthunt"] }).notNull(),
  description: text("description"),
  recordsCount: integer("records_count").default(0),
  type: varchar("type", { length: 50, enum: ["daily", "weekly", "monthly", "yearly"] }).notNull(),
  status: boolean("status").default(true),
  periodKey: varchar("period_key", { length: 20 }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
}, (table) => [
  uniqueIndex("unique_source_type_period_key").on(table.source, table.type, table.periodKey),
]);

/**
 * 排行记录表，用于存储排行记录数据。
 */
export const rankingRecords = pgTable("ranking_records", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  rankingId: text("ranking_id").references(() => rankings.id),
  entityId: text("entity_id").notNull(),
  entityName: varchar("entity_name", { length: 255 }).notNull(),
  entityType: varchar("entity_type", { length: 50, enum: ["apps"] }).notNull(),
  score: integer("score").notNull(), // Drizzle 不支持 DECIMAL，可以用 integer 或 float
  rank: integer("rank").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
}, (table) => [
  uniqueIndex("unique_ranking_records_key").on(table.rankingId, table.entityId, table.entityType),
]);

// 排行-应用关系
export const rankingRecordsRelations = relations(rankingRecords, ({ one }) => ({
  app: one(apps, {
    fields: [rankingRecords.entityId],
    references: [apps.id],
  }),
}));


/**
 * 仓库快照表，用于存储仓库的快照数据。按照年月日存储。即存储的是每天的快照数据。
 */
export const snapshots = pgTable(
  "snapshots",
  {
    id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
    repoId: text("repo_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
    year: integer("year").notNull(),
    months: jsonb("months"),
    day: integer("day").notNull(),
    month: integer("month").notNull(),
    forks: integer("forks"),
    stars: integer("stars"),
    watchers: integer("watchers"),
    openIssues: integer("open_issues"),
    subscribers: integer("subscribers"),
    contributors: integer("contributors"),
    pullRequests: integer("pull_requests"),
    releases: integer("releases"),
    commits: integer("commits"),
  },
  (table) => [
    index("snapshots_repo_id_idx").on(table.repoId),
    index("snapshots_year_idx").on(table.year),
  ]
);

/*
 * 按月存储的快照数据，用于存储仓库的快照数据。
*/
export const snapshotsMonthly = pgTable(
  "snapshots_monthly",
  {
    id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
    repoId: text("repo_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    forks: integer("forks"),
    stars: integer("stars"),
    watchers: integer("watchers"),
    openIssues: integer("open_issues"),
    subscribers: integer("subscribers"),
    contributors: integer("contributors"),
    pullRequests: integer("pull_requests"),
    releases: integer("releases"),
    commits: integer("commits"),
  },
  (table) => [
    index("snapshots_monthly_repo_id_idx").on(table.repoId),
    index("snapshots_monthly_year_idx").on(table.year),
    index("snapshots_monthly_month_idx").on(table.month),
    uniqueIndex("snapshots_monthly_unique_idx").on(table.repoId, table.year, table.month),
  ]
);

/*
 * 按周存储的快照数据，用于存储仓库的快照数据。
*/
export const snapshotsWeekly = pgTable(
  "snapshots_weekly",
  {
    id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
    repoId: text("repo_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
    year: integer("year").notNull(),
    week: integer("week").notNull(),
    forks: integer("forks"),
    stars: integer("stars"),
    watchers: integer("watchers"),
    openIssues: integer("open_issues"),
    subscribers: integer("subscribers"),
    contributors: integer("contributors"),
    pullRequests: integer("pull_requests"),
    releases: integer("releases"),
    commits: integer("commits"),
  },
  (table) => [
    index("snapshots_weekly_repo_id_idx").on(table.repoId),
    index("snapshots_weekly_year_idx").on(table.year),
    index("snapshots_weekly_week_idx").on(table.week),
    uniqueIndex("snapshots_weekly_unique_idx").on(table.repoId, table.year, table.week),
  ]
);

export const snapshotsRelations = relations(snapshots, ({ one }) => ({
  repo: one(repos, {
    fields: [snapshots.repoId],
    references: [repos.id],
  }),
}));

export const snapshotsWeeklyRelations = relations(snapshotsWeekly, ({ one }) => ({
  repo: one(repos, {
    fields: [snapshotsWeekly.repoId],
    references: [repos.id],
  }),
}));

export const snapshotsMonthlyRelations = relations(snapshotsMonthly, ({ one }) => ({
  repo: one(repos, {
    fields: [snapshotsMonthly.repoId],
    references: [repos.id],
  }),
}));

/**
 * github代码仓库表，用于存储github代码仓库的基本信息。
 */
export const repos = pgTable(
  "repos",
  {
    id: text("id").primaryKey(),
    // Date of addition to Best of JS
    added_at: timestamp("added_at").notNull().defaultNow(),
    // Last update (by the daily task)
    updated_at: timestamp("updated_at"),
    // From GitHub REST API
    archived: boolean("archived"),
    default_branch: text("default_branch"),
    description: text("description"),
    homepage: text("homepage"),
    name: text("name").notNull(),
    fullName: text("full_name").notNull(),
    owner: text("owner").notNull(),
    owner_id: integer("owner_id").notNull(), // used in GitHub users avatar URLs
    stars: integer("stargazers_count"),
    topics: jsonb("topics"),

    pushed_at: timestamp("pushed_at").notNull(),
    created_at: timestamp("created_at").notNull(),

    // From GitHub GraphQL API
    last_commit: timestamp("last_commit"),
    commit_count: integer("commit_count"),

    // From scrapping
    contributor_count: integer("contributor_count"),

    // New fields from GitHub GraphQL API
    mentionable_users_count: integer("mentionable_users_count"),
    watchers_count: integer("watchers_count"),
    license_spdx_id: text("license_spdx_id"),
    pull_requests_count: integer("pull_requests_count"),
    releases_count: integer("releases_count"),
    languages: jsonb("languages"),
    open_graph_image_url: text("open_graph_image_url"),
    uses_custom_open_graph_image: boolean("uses_custom_open_graph_image"),
    latest_release_name: text("latest_release_name"),
    latest_release_tag_name: text("latest_release_tag_name"),
    latest_release_published_at: timestamp("latest_release_published_at"),
    latest_release_url: text("latest_release_url"),
    latest_release_description: text("latest_release_description"),
    forks: integer("forks"),

    // 新增字段：README内容和翻译
    readme_content: text("readme_content"), // 英文README内容
    readme_content_zh: text("readme_content_zh"), // 中文README内容
    description_zh: text("description_zh"), // 翻译后的描述
    icon_url: text("icon_url"), // 上传到OSS的图标URL
    open_graph_image_oss_url: text("open_graph_image_oss_url"), // 上传到OSS的Open Graph图片URL
    latest_release_description_zh: text("latest_release_description_zh"), // 翻译后的Release Note内容
  },
  (table) => [uniqueIndex("name_owner_index").on(table.owner, table.name)]
);

/**
 * 仓库关系表，用于存储仓库和名人堂的关系。
 */
export const reposRelations = relations(repos, ({ many, one }) => ({
  apps: many(apps),
  snapshots: many(snapshots),
  snapshotsWeekly: many(snapshotsWeekly),
  snapshotsMonthly: many(snapshotsMonthly),
  hallOfFameMember: many(hallOfFameToRepos),
}));


/**
 * 名人堂表，用于存储名人堂的基本信息。
 */
export const hallOfFame = pgTable("hall_of_fame", {
  username: text("username").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  followers: integer("followers"),
  bio: text("bio"),
  homepage: text("homepage"),
  twitter: text("twitter"),
  github: text("github"),
  discord: text("discord"),
  avatar: text("avatar"),
  npmUsername: text("npm_username"),
  npmPackageCount: integer("npm_package_count"),
  status: text("status", { enum: ["active", "inactive", "archived"] })
    .default("active")
    .notNull(),
});

/**
 * 名人堂-仓库关系表，用于存储名人堂和仓库的关系。
 */
export const hallOfFameToRepos = pgTable(
  "hall_of_fame_to_repos",
  {
    username: text("username")
      .notNull()
      .references(() => hallOfFame.username, { onDelete: "cascade" }),
    repoId: text("repo_id")
      .notNull()
      .references(() => repos.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.username, t.repoId] })]
);

/**
 * 名人堂关系表，用于存储名人堂和仓库的关系。
 */
export const hallOfFameRelations = relations(hallOfFame, ({ many }) => ({
  hallOfFameToRepos: many(hallOfFameToRepos),
  repos: many(repos),
}));
