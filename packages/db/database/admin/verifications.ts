import { createId } from "@paralleldrive/cuid2";
import { verification } from "../../schema";
import { eq } from "drizzle-orm";
import { db } from "../../index";

const generateCode = () => Math.floor(Math.random() * 900000) + 100000

export const verificationsDataAccess = {
  // 创建验证码，发送魔法链接验证邮箱时使用
  create: async (identifier: string, expiresAt: Date) => {
    const code = generateCode().toString();
    const [verification] = await db.insert(verification).values({
      id: createId(),
      identifier,
      value: code,
      expiresAt,
    }).returning();
    return verification;
  },

  // 根据标识符获取验证码
  getByIdentifier: async (identifier: string) => {
    const verification = await db.query.verifications.findFirst({
      where: eq(verifications.identifier, identifier),
    });
    return verification;
  },

  getById: async (id: string) => {
    const verification = await db.query.verifications.findFirst({
      where: eq(verifications.id, id),
    });
    return verification;
  },

}

