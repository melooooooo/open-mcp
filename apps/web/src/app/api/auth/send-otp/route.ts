import { NextResponse } from "next/server"
import { createId } from "@paralleldrive/cuid2"
import { addMinutes, subHours, subSeconds } from "date-fns"
import { db } from "@repo/db"
import { user, verification } from "@repo/db/schema"
import { eq, and, gt, sql } from "drizzle-orm"
import { sendMagicCodeEmail } from "@repo/email"

const MIN_PASSWORD_LENGTH = 8
const DAILY_LIMIT = 20
const COOLDOWN_SECONDS = 60

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = (body?.email as string)?.trim().toLowerCase()
    const password = body?.password as string

    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 })
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `密码至少 ${MIN_PASSWORD_LENGTH} 位` }, { status: 400 })
    }

    // 已注册检查
    const existingUser = await db.query.user.findFirst({ where: eq(user.email, email) })
    if (existingUser) {
      return NextResponse.json({ error: "邮箱已注册，请直接登录" }, { status: 400 })
    }

    const now = new Date()

    // 60s 冷却
    const recentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(verification)
      .where(
        and(
          eq(verification.identifier, email),
          gt(verification.createdAt, subSeconds(now, COOLDOWN_SECONDS))
        )
      )
      .then(res => res[0]?.count ?? 0)

    if (recentCount > 0) {
      return NextResponse.json({ error: "发送过于频繁，请稍后再试" }, { status: 429 })
    }

    // 24h 上限
    const dailyCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(verification)
      .where(
        and(
          eq(verification.identifier, email),
          gt(verification.createdAt, subHours(now, 24))
        )
      )
      .then(res => res[0]?.count ?? 0)

    if (dailyCount >= DAILY_LIMIT) {
      return NextResponse.json({ error: "今日发送次数已达上限" }, { status: 429 })
    }

    const code = (Math.floor(Math.random() * 900000) + 100000).toString()

    await db.insert(verification).values({
      id: createId(),
      identifier: email,
      value: code,
      expiresAt: addMinutes(now, 10),
      createdAt: now,
      updatedAt: now,
    })

    await sendMagicCodeEmail({
      to: email,
      code,
      subject: "银行帮注册验证码",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[send-otp] error", error)
    return NextResponse.json({ error: "发送失败，请稍后重试" }, { status: 500 })
  }
}
