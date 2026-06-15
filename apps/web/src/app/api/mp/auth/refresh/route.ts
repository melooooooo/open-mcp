import { refreshClientAuthSession } from "@/lib/client-auth"
import { fail, ok, toMpUser } from "../../_shared/response"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const refreshToken = typeof body?.refreshToken === "string" ? body.refreshToken.trim() : ""

  if (!refreshToken) return fail("BAD_REQUEST", "缺少 refreshToken")

  const session = await refreshClientAuthSession(refreshToken)
  if (!session) return fail("UNAUTHORIZED", "登录已过期，请重新登录", 401)

  return ok({
    accessToken: session.accessToken,
    expiresIn: session.expiresIn,
    refreshToken: session.refreshToken,
    user: toMpUser(session.user),
  })
}
