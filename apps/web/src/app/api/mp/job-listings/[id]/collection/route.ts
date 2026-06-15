import { db } from "@repo/db"
import { userJobListingCollections } from "@repo/db/schema"
import { and, eq } from "drizzle-orm"
import { fail, getCurrentUser, ok } from "../../../_shared/response"

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(request)
  if (!user?.id) return fail("UNAUTHORIZED", "请先登录", 401)

  const { id } = await context.params
  const existing = await db.query.userJobListingCollections.findFirst({
    where: and(eq(userJobListingCollections.userId, user.id), eq(userJobListingCollections.jobListingId, id)),
  })

  if (existing) {
    await db
      .delete(userJobListingCollections)
      .where(and(eq(userJobListingCollections.userId, user.id), eq(userJobListingCollections.jobListingId, id)))
    return ok({ isCollected: false })
  }

  await db.insert(userJobListingCollections).values({ userId: user.id, jobListingId: id })
  return ok({ isCollected: true })
}
