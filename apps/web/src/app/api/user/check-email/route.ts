
import { NextResponse } from "next/server"
import { db } from "@repo/db"
import { user } from "@repo/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = (body?.email as string)?.trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: "邮箱不能为空" }, { status: 400 })
    }

    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
      columns: {
        id: true,
        email: true,
        password: true, // Check if password exists (though usually it does for registered users)
      }
    })

    if (existingUser) {
      return NextResponse.json({
        exists: true,
        hasPassword: !!existingUser.password
      })
    }

    return NextResponse.json({
      exists: false,
      hasPassword: false
    })

  } catch (error) {
    console.error("[check-email] error", error)
    return NextResponse.json({ error: "检查失败" }, { status: 500 })
  }
}
