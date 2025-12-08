
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { siteFeedbacks } from "../../mcp-schema";

export const zSiteFeedback = createSelectSchema(siteFeedbacks);
export const zCreateSiteFeedback = createInsertSchema(siteFeedbacks)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    status: true,
    adminRemarks: true,
    userId: true, // Handle explicitly
  })
  .extend({
    title: z.string().min(5, "标题至少5个字符"),
    description: z.string().min(10, "描述至少10个字符"),
    userEmail: z.string().email("请输入有效的邮箱地址").optional().or(z.literal("")),
  });

export const zSiteFeedbackTypeEnum = z.enum(["feature", "bug", "improvement", "other"]);
export const zSiteFeedbackStatusEnum = z.enum(["pending", "reviewing", "accepted", "implemented", "rejected", "duplicate"]);

export type SiteFeedback = z.infer<typeof zSiteFeedback>;
export type CreateSiteFeedback = z.infer<typeof zCreateSiteFeedback>;
