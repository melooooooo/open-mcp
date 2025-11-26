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

// 用户点赞表
export const userLikes = pgTable("user_likes", {
  id: text("id").primaryKey().notNull().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  jobId: uuid("job_id").notNull().references(() => scrapedJobs.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => [
  index("user_likes_user_id_idx").on(table.userId),
  index("user_likes_job_id_idx").on(table.jobId),
  uniqueIndex("user_likes_unique_idx").on(table.userId, table.jobId),
]);

// Relations
export const scrapedJobsRelations = relations(scrapedJobs, ({ many }) => ({
  collections: many(userCollections),
  likes: many(userLikes),
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

export const userLikesRelations = relations(userLikes, ({ one }) => ({
  user: one(user, {
    fields: [userLikes.userId],
    references: [user.id],
  }),
  job: one(scrapedJobs, {
    fields: [userLikes.jobId],
    references: [scrapedJobs.id],
  }),
}));
