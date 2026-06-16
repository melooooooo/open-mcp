import { eq } from "drizzle-orm"

import { getUserFromBearer, markMiniProgramActivated } from "@/lib/client-auth"
import { db } from "@repo/db"
import { user as userTable } from "@repo/db/schema"
import { fail, ok, toMpUser } from "../../_shared/response"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const currentUser = await getUserFromBearer(request)
  if (!currentUser?.id) return fail("UNAUTHORIZED", "登录已过期，请重新登录", 401)

  await markMiniProgramActivated(currentUser.id)

  const freshUser = await db.query.user.findFirst({
    where: eq(userTable.id, currentUser.id),
  })

  return ok({
    user: toMpUser(freshUser ?? currentUser),
  })
}
