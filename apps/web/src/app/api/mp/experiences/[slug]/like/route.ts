import { db } from "@repo/db"
import { financeExperiences, userExperienceLikes } from "@repo/db/schema"
import { and, eq, sql } from "drizzle-orm"
import { fail, getCurrentUser, ok } from "../../../_shared/response"

export async function POST(_: Request, context: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser()
  if (!user?.id) return fail("UNAUTHORIZED", "请先登录", 401)

  const { slug } = await context.params
  const experience = await db.query.financeExperiences.findFirst({
    where: eq(financeExperiences.slug, decodeURIComponent(slug)),
    columns: { id: true },
  })
  if (!experience) return fail("NOT_FOUND", "经验不存在", 404)

  const existing = await db.query.userExperienceLikes.findFirst({
    where: and(eq(userExperienceLikes.userId, user.id), eq(userExperienceLikes.experienceId, experience.id)),
  })

  if (existing) {
    await db.transaction(async (tx) => {
      await tx
        .delete(userExperienceLikes)
        .where(and(eq(userExperienceLikes.userId, user.id), eq(userExperienceLikes.experienceId, experience.id)))
      await tx
        .update(financeExperiences)
        .set({ likeCount: sql`greatest(coalesce(${financeExperiences.likeCount}, 0) - 1, 0)` })
        .where(eq(financeExperiences.id, experience.id))
    })
    return ok({ isLiked: false })
  }

  await db.transaction(async (tx) => {
    await tx.insert(userExperienceLikes).values({ userId: user.id, experienceId: experience.id })
    await tx
      .update(financeExperiences)
      .set({ likeCount: sql`coalesce(${financeExperiences.likeCount}, 0) + 1` })
      .where(eq(financeExperiences.id, experience.id))
  })
  return ok({ isLiked: true })
}

