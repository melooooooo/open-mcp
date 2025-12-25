import { createId } from "@paralleldrive/cuid2";
import { verification } from "../../schema";
import { eq } from "drizzle-orm";
import { db } from "../../index";

const generateCode = () => Math.floor(Math.random() * 900000) + 100000

export const verificationsDataAccess = {
  // 创建验证码，发送魔法链接验证邮箱时使用
  // 创建验证码，发送魔法链接验证邮箱时使用
  create: async (identifier: string, expiresAt: Date) => {
    const code = generateCode().toString();
    const [newVerification] = await db.insert(verification).values({
      id: createId(),
      identifier,
      value: code,
      expiresAt,
    }).returning();
    return newVerification;
  },

  // 根据标识符获取验证码
  getByIdentifier: async (identifier: string) => {
    const result = await db.query.verification.findFirst({
      where: eq(verification.identifier, identifier),
    });
    return result;
  },

  getById: async (id: string) => {
    const result = await db.query.verification.findFirst({
      where: eq(verification.id, id),
    });
    return result;
  },

}

