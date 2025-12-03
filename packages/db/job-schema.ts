import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  index,
  integer,
  boolean,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

// 职位表
export const scrapedJobs = pgTable("scraped_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  link: text("link").notNull(), // 原始链接
  content: text("content"), // 职位详情内容
  author: varchar("author", { length: 100 }), // 发布人
  replyCount: integer("reply_count").default(0), // 回复数
  lastReplyDate: varchar("last_reply_date", { length: 50 }), // 最后回复时间，格式不统一，用varchar
  publishDate: varchar("publish_date", { length: 50 }), // 发布时间，格式不统一，用varchar
  isTop: boolean("is_top").default(false), // 是否置顶

  // 以下是结构化字段，后续可以分析填充
  companyName: varchar("company_name", { length: 255 }),
  jobType: varchar("job_type", { length: 50 }), // 校招/社招/实习
  location: varchar("location", { length: 255 }),
  salary: varchar("salary", { length: 100 }),

  source: varchar("source", { length: 50 }).default("byr_bbs"), // 来源站点
  externalId: varchar("external_id", { length: 100 }), // 外部ID，例如帖子ID

  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("scraped_jobs_source_idx").on(table.source),
  index("scraped_jobs_external_id_idx").on(table.externalId),
  index("scraped_jobs_publish_date_idx").on(table.publishDate),
]);

// 用户收藏表
export const userCollections = pgTable("user_collections", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  jobId: uuid("job_id").notNull().references(() => scrapedJobs.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("user_collections_user_id_idx").on(table.userId),
  index("user_collections_job_id_idx").on(table.jobId),
  uniqueIndex("user_collections_unique_idx").on(table.userId, table.jobId),
]);


// Relations
export const scrapedJobsRelations = relations(scrapedJobs, ({ many }) => ({
  collections: many(userCollections),
}));

export const userCollectionsRelations = relations(userCollections, ({ one }) => ({
  user: one(user, {
    fields: [userCollections.userId],
    references: [user.id],
  }),
  job: one(scrapedJobs, {
    fields: [userCollections.jobId],
    references: [scrapedJobs.id],
  }),
}));


// 招聘职位表
export const jobListings = pgTable("job_listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobTitle: text("job_title"),
  companyName: text("company_name"),
  workLocation: text("work_location"),
  deadline: text("deadline"),
  sourceUpdatedAt: text("source_updated_at"),
  companyType: text("company_type"),
  industryCategory: text("industry_category"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// 经验分享表
export const financeExperiences = pgTable("finance_experiences", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug"),
  title: text("title").notNull(),
  authorName: text("author_name"),
  organizationName: text("organization_name"),
  articleType: text("article_type"),
  jobTitle: text("job_title"),
  tags: text("tags").array(),
  difficulty: text("difficulty"),
  readTimeMinutes: integer("read_time_minutes"),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  isPinned: boolean("is_pinned").default(false),
  isHot: boolean("is_hot").default(false),
  publishTime: timestamp("publish_time", { mode: "date" }),
  coverAssetPath: text("cover_asset_path"),
  summary: text("summary"),
  industry: text("industry"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// 求职导航表
export const cpJobSites = pgTable("cp_job_sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  companyName: text("company_name"),
  companyLogo: text("company_logo"),
  companySize: text("company_size"),
  department: text("department"),
  location: text("location").array(), // Based on ["全国"]
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  jobType: text("job_type"),
  educationRequirement: text("education_requirement"),
  tags: text("tags").array(),
  applicationDeadline: timestamp("application_deadline", { mode: "date" }),
  viewCount: integer("view_count").default(0),
  applicationCount: integer("application_count").default(0),
  isHot: boolean("is_hot").default(false),
  isNew: boolean("is_new").default(false),
  hasReferral: boolean("has_referral").default(false),
  websiteUrl: text("website_url"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// 招聘职位收藏表
export const userJobListingCollections = pgTable("user_job_listing_collections", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  jobListingId: uuid("job_listing_id").notNull().references(() => jobListings.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("user_job_listing_collections_user_id_idx").on(table.userId),
  index("user_job_listing_collections_job_id_idx").on(table.jobListingId),
  uniqueIndex("user_job_listing_collections_unique_idx").on(table.userId, table.jobListingId),
]);

// 经验分享点赞表
export const userExperienceLikes = pgTable("user_experience_likes", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  experienceId: uuid("experience_id").notNull().references(() => financeExperiences.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("user_experience_likes_user_id_idx").on(table.userId),
  index("user_experience_likes_experience_id_idx").on(table.experienceId),
  uniqueIndex("user_experience_likes_unique_idx").on(table.userId, table.experienceId),
]);

// New Relations
export const jobListingsRelations = relations(jobListings, ({ many }) => ({
  collections: many(userJobListingCollections),
}));

export const financeExperiencesRelations = relations(financeExperiences, ({ many }) => ({
  likes: many(userExperienceLikes),
}));

export const userJobListingCollectionsRelations = relations(userJobListingCollections, ({ one }) => ({
  user: one(user, {
    fields: [userJobListingCollections.userId],
    references: [user.id],
  }),
  jobListing: one(jobListings, {
    fields: [userJobListingCollections.jobListingId],
    references: [jobListings.id],
  }),
}));

export const userExperienceLikesRelations = relations(userExperienceLikes, ({ one }) => ({
  user: one(user, {
    fields: [userExperienceLikes.userId],
    references: [user.id],
  }),
  experience: one(financeExperiences, {
    fields: [userExperienceLikes.experienceId],
    references: [financeExperiences.id],
  }),
}));
