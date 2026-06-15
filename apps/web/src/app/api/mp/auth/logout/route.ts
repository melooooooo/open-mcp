import { revokeClientAuthSession } from "@/lib/client-auth"
import { ok } from "../../_shared/response"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const refreshToken = typeof body?.refreshToken === "string" ? body.refreshToken.trim() : ""

  if (refreshToken) {
    await revokeClientAuthSession(refreshToken)
  }

  return ok({ loggedOut: true })
}
