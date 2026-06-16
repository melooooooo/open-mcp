import { db } from "@repo/db"
import { userCollections } from "@repo/db/schema"
import { and, eq } from "drizzle-orm"
import { markMiniProgramActivated } from "@/lib/client-auth"
import { fail, getCurrentUser, ok } from "../../../_shared/response"

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(request)
  if (!user?.id) return fail("UNAUTHORIZED", "请先登录", 401)

  const activatedAt = (user as { miniProgramActivatedAt?: Date | null }).miniProgramActivatedAt
  if (!activatedAt) {
    await markMiniProgramActivated(user.id)
  }

  const { id } = await context.params
  const existing = await db.query.userCollections.findFirst({
    where: and(eq(userCollections.userId, user.id), eq(userCollections.jobId, id)),
  })

  if (existing) {
    await db.delete(userCollections).where(and(eq(userCollections.userId, user.id), eq(userCollections.jobId, id)))
    return ok({ isCollected: false })
  }

  await db.insert(userCollections).values({ userId: user.id, jobId: id })
  return ok({ isCollected: true })
}
