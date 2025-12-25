
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { siteFeedbacks } from "../../mcp-schema";

export const zSiteFeedback = createSelectSchema(siteFeedbacks);

// 基础 schema，不使用 refinements 以避免 drizzle-zod 版本兼容性问题
const baseSchema = createInsertSchema(siteFeedbacks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  adminRemarks: true,
  userId: true,
});

// 手动定义带验证的 schema
export const zCreateSiteFeedback = z.object({
  title: z.string().min(5, "标题至少5个字符"),
  description: z.string().min(10, "描述至少10个字符"),
  type: z.enum(["feature", "bug", "improvement", "other"]),
  userName: z.string().optional(),
  userEmail: z.string().email("请输入有效的邮箱地址").optional().or(z.literal("")),
  attachmentUrl: z.string().optional(),
});

export const zSiteFeedbackTypeEnum = z.enum(["feature", "bug", "improvement", "other"]);
export const zSiteFeedbackStatusEnum = z.enum(["pending", "reviewing", "accepted", "implemented", "rejected", "duplicate"]);

import { type InferSelectModel } from "drizzle-orm";

export type SiteFeedback = InferSelectModel<typeof siteFeedbacks>;
export type CreateSiteFeedback = z.infer<typeof zCreateSiteFeedback>;
