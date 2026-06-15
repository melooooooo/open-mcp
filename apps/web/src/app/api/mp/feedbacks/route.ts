import { db } from "@repo/db"
import { siteFeedbacks } from "@repo/db/schema"
import { fail, getCurrentUser, ok } from "../_shared/response"

const allowedTypes = new Set(["feature", "bug", "improvement", "other"])

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return fail("BAD_REQUEST", "请求体格式错误")

  const title = typeof body.title === "string" ? body.title.trim() : ""
  const description = typeof body.description === "string" ? body.description.trim() : ""
  const type = typeof body.type === "string" && allowedTypes.has(body.type) ? body.type : "feature"

  if (!title) return fail("VALIDATION_ERROR", "标题不能为空")
  if (!description) return fail("VALIDATION_ERROR", "详细描述不能为空")

  const user = await getCurrentUser(request)
  await db.insert(siteFeedbacks).values({
    userId: user?.id,
    userName: user?.name,
    userEmail: typeof body.userEmail === "string" ? body.userEmail.trim() : undefined,
    title,
    description,
    type: type as any,
    attachmentUrl: typeof body.attachmentUrl === "string" ? body.attachmentUrl : undefined,
  })

  return ok({ submitted: true })
}
