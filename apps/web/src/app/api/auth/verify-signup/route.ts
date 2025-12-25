import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { desc, eq, and, gt } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@repo/db"
import { user, verification } from "@repo/db/schema"

const MIN_PASSWORD_LENGTH = 8

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = (body?.email as string)?.trim().toLowerCase()
    const password = body?.password as string
    const code = (body?.code as string)?.trim()

    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 })
    }
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `密码至少 ${MIN_PASSWORD_LENGTH} 位` }, { status: 400 })
    }
    if (!code || code.length !== 6) {
      return NextResponse.json({ error: "验证码无效" }, { status: 400 })
    }

    // 已注册检查
    const existingUser = await db.query.user.findFirst({ where: eq(user.email, email) })
    if (existingUser) {
      return NextResponse.json({ error: "邮箱已注册，请直接登录" }, { status: 400 })
    }

    const now = new Date()

    // 1. 先查找是否存在未过期的记录（只匹配邮箱和过期时间）
    const record = await db
      .select()
      .from(verification)
      .where(
        and(
          eq(verification.identifier, email),
          gt(verification.expiresAt, now)
        )
      )
      .orderBy(desc(verification.createdAt))
      .limit(1)
      .then(res => res[0])

    // 如果还没有记录，或者均已过期
    if (!record) {
      return NextResponse.json({ error: "验证码无效或已过期" }, { status: 400 })
    }

    // 2. 比对验证码是否正确
    if (record.value !== code) {
      // 验证码错误：不删除记录，允许重试
      return NextResponse.json({ error: "验证码错误" }, { status: 400 })
    }

    // 额外保障：若 createdAt 为空，视为无效（数据完整性）
    if (!record.createdAt) {
      return NextResponse.json({ error: "验证码记录不完整，请重新发送" }, { status: 400 })
    }

    // 创建用户（Better Auth）
    const name = email.split("@")[0] || "用户"
    let signupResult: { response: any; headers: Headers }
    try {
      signupResult = await auth.api.signUpEmail({
        body: { name, email, password },
        headers: await headers() as any,
        returnHeaders: true,
      })
    } catch (error) {
      const message =
        (error as any)?.body?.message ||
        (error as any)?.message ||
        "注册失败，请稍后重试"
      return NextResponse.json({ error: message }, { status: 400 })
    }

    // 标记邮箱已验证
    await db
      .update(user)
      .set({ emailVerified: true, updatedAt: now })
      .where(eq(user.email, email))

    // 清理验证码记录
    await db.delete(verification).where(eq(verification.identifier, email))

    // 透传 Better Auth 写入的 Cookie（用于自动登录）
    const res = NextResponse.json({
      success: true,
      user: signupResult.response?.user ?? null,
    })

    const getSetCookie = (signupResult.headers as any)?.getSetCookie
    const setCookies: string[] =
      typeof getSetCookie === "function"
        ? getSetCookie.call(signupResult.headers)
        : signupResult.headers.get("set-cookie")
          ? [signupResult.headers.get("set-cookie") as string]
          : []

    for (const cookie of setCookies) {
      res.headers.append("set-cookie", cookie)
    }

    return res
  } catch (error) {
    console.error("[verify-signup] error", error)
    return NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 })
  }
}
