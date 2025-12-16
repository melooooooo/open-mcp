import dotenv from "dotenv"
// 优先加载 .env.local，不存在则回退默认 .env
dotenv.config({ path: ".env.local" })
dotenv.config()

import { sendMagicCodeEmail } from "@repo/email"

function randomOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function main() {
  const to = process.argv[2]
  if (!to) {
    console.error("用法: pnpm tsx scripts/test-resend-otp.ts <收件邮箱>")
    process.exit(1)
  }

  const code = randomOtp()
  const subject = "Resend 验证码发送测试"

  console.info("准备发送验证码", { to, code, subject, from: process.env.RESEND_FROM })
  const result = await sendMagicCodeEmail({ to, code, subject })
  console.info("发送完成", result)
}

main().catch((err) => {
  console.error("发送失败", err)
  process.exit(1)
})
