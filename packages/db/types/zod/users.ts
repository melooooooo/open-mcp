import { z } from "zod";
import { zBaseEntitySchema, zSearchSchema } from "./common";

// 枚举类型定义
export const zUserRoleEnum = z.enum(["user", "admin", "member"]);
export const zAccountStatusEnum = z.enum(["suspended", "disabled", "active", "onboarding"]);
export const zProviderTypeEnum = z.enum(["oauth", "email", "credentials"]);

// 用户搜索
export const zSearchUsersSchema = zSearchSchema.extend({
  status: zAccountStatusEnum.optional(),
  role: zUserRoleEnum.optional(),
});

// 用户创建
export const zCreateUserSchema = zBaseEntitySchema.extend({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  image: z.string().optional(),
});

// 用户更新
export const zUpdateUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  image: z.string().optional(),
  role: zUserRoleEnum,
  banned: z.boolean(),
});

export const zUserSchema = zUpdateUserSchema.extend({
  emailVerified: z.boolean(),
  phoneNumber: z.string().optional(),
  phoneNumberVerified: z.boolean(),
});

export type User = z.infer<typeof zUserSchema>;
export type CreateUser = z.infer<typeof zCreateUserSchema>;
export type UpdateUser = z.infer<typeof zUpdateUserSchema>;
export type UserRole = z.infer<typeof zUserRoleEnum>;
