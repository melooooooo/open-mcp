import { createHash } from "crypto"
import { createId } from "@paralleldrive/cuid2"
import { and, eq } from "drizzle-orm"

import { createClientAuthSession, markMiniProgramActivated } from "@/lib/client-auth"
import { db } from "@repo/db"
import { account, user as userTable } from "@repo/db/schema"
import { fail, ok, toMpUser } from "../../_shared/response"

export const runtime = "nodejs"

const WECHAT_MINI_PROVIDER = "wechat_mini"
const WECHAT_UNION_PROVIDER = "wechat_union"

type WechatCodeSession = {
  openid?: string
  unionid?: string
  session_key?: string
  errcode?: number
  errmsg?: string
}

function getWechatMiniConfig() {
  return {
    appId: process.env.WECHAT_MINI_APP_ID || process.env.WX_MINI_APP_ID || process.env.MP_WECHAT_APP_ID,
    appSecret:
      process.env.WECHAT_MINI_APP_SECRET ||
      process.env.WX_MINI_APP_SECRET ||
      process.env.MP_WECHAT_APP_SECRET,
  }
}

function placeholderEmail(openid: string) {
  const digest = createHash("sha256").update(openid).digest("hex").slice(0, 24)
  return `wechat-mini-${digest}@placeholder.yinhangbang.local`
}

async function fetchWechatSession(code: string) {
  const { appId, appSecret } = getWechatMiniConfig()
  if (!appId || !appSecret) {
    throw new Error("WECHAT_MINI_APP_ID and WECHAT_MINI_APP_SECRET are required")
  }

  const url = new URL("https://api.weixin.qq.com/sns/jscode2session")
  url.searchParams.set("appid", appId)
  url.searchParams.set("secret", appSecret)
  url.searchParams.set("js_code", code)
  url.searchParams.set("grant_type", "authorization_code")

  const response = await fetch(url)
  return (await response.json()) as WechatCodeSession
}

async function findAccount(providerId: string, accountId: string) {
  return db.query.account.findFirst({
    where: and(eq(account.providerId, providerId), eq(account.accountId, accountId)),
  })
}

async function ensureAccount(params: {
  userId: string
  providerId: string
  accountId: string
}) {
  const existing = await findAccount(params.providerId, params.accountId)
  if (existing) return

  const now = new Date()
  await db.insert(account).values({
    id: createId(),
    userId: params.userId,
    providerId: params.providerId,
    accountId: params.accountId,
    createdAt: now,
    updatedAt: now,
  })
}

async function findOrCreateUser(params: {
  openid: string
  unionid?: string
}) {
  const unionAccount = params.unionid
    ? await findAccount(WECHAT_UNION_PROVIDER, params.unionid)
    : null
  const miniAccount = await findAccount(WECHAT_MINI_PROVIDER, params.openid)
  const matchedAccount = unionAccount || miniAccount

  if (matchedAccount) {
    const existingUser = await db.query.user.findFirst({
      where: eq(userTable.id, matchedAccount.userId),
    })
    if (existingUser) {
      await ensureAccount({
        userId: existingUser.id,
        providerId: WECHAT_MINI_PROVIDER,
        accountId: params.openid,
      })
      if (params.unionid) {
        await ensureAccount({
          userId: existingUser.id,
          providerId: WECHAT_UNION_PROVIDER,
          accountId: params.unionid,
        })
      }
      return existingUser
    }
  }

  const now = new Date()
  const userId = createId()
  const [createdUser] = await db
    .insert(userTable)
    .values({
      id: userId,
      name: "微信用户",
      email: placeholderEmail(params.openid),
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  if (!createdUser) {
    throw new Error("Failed to create WeChat mini program user")
  }

  await ensureAccount({
    userId,
    providerId: WECHAT_MINI_PROVIDER,
    accountId: params.openid,
  })

  if (params.unionid) {
    await ensureAccount({
      userId,
      providerId: WECHAT_UNION_PROVIDER,
      accountId: params.unionid,
    })
  }

  return createdUser
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const code = typeof body?.code === "string" ? body.code.trim() : ""
  const deviceId = typeof body?.deviceId === "string" ? body.deviceId.trim() : undefined
  const loginMode = body?.loginMode === "silent" ? "silent" : "interactive"

  if (!code) return fail("BAD_REQUEST", "缺少微信登录 code")

  let wechatSession: WechatCodeSession
  try {
    wechatSession = await fetchWechatSession(code)
  } catch (error) {
    console.error("[mp/auth/wechat-login] code2session failed", error)
    return fail("WECHAT_CONFIG_ERROR", "微信登录暂不可用", 500)
  }

  if (!wechatSession.openid || wechatSession.errcode) {
    return fail(
      "WECHAT_LOGIN_FAILED",
      wechatSession.errmsg || "微信登录失败",
      401
    )
  }

  try {
    const currentUser = await findOrCreateUser({
      openid: wechatSession.openid,
      unionid: wechatSession.unionid,
    })
    const session = await createClientAuthSession({
      userId: currentUser.id,
      clientType: "mini_program",
      deviceId,
    })

    if (loginMode === "interactive") {
      await markMiniProgramActivated(currentUser.id)
    }

    const freshUser = await db.query.user.findFirst({
      where: eq(userTable.id, currentUser.id),
    })

    return ok({
      ...session,
      user: toMpUser(freshUser ?? currentUser),
    })
  } catch (error) {
    console.error("[mp/auth/wechat-login] login failed", error)
    return fail("INTERNAL_ERROR", "登录失败，请稍后重试", 500)
  }
}
