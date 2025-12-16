type PushplusTemplate = "html" | "txt"

interface SendPushplusEmailParams {
  token?: string
  subject: string
  content: string
  channel?: string
  template?: PushplusTemplate
  apiBase?: string
}

interface PushplusResponse {
  code: number
  msg?: string
  data?: unknown
}

/**
 * 通过 PushPlus 发送邮件（channel: mail）。
 * 如果未配置 token，调用方应回落到其他邮件服务。
 */
export async function sendPushplusEmail(params: SendPushplusEmailParams) {
  const {
    token = process.env.PUSHPLUS_TOKEN,
    subject,
    content,
    channel = process.env.PUSHPLUS_CHANNEL || "mail",
    template = (process.env.PUSHPLUS_TEMPLATE as PushplusTemplate) || "html",
    apiBase = process.env.PUSHPLUS_URL || "https://www.pushplus.plus/send",
  } = params

  if (!token) {
    throw new Error("PushPlus token 未配置，跳过 PushPlus 邮件发送")
  }

  const payload = {
    token,
    channel,
    title: subject,
    content,
    template,
  }

  const res = await fetch(apiBase, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data = (await res.json()) as PushplusResponse

  if (!res.ok || data.code !== 200) {
    throw new Error(`PushPlus 发送失败: HTTP ${res.status} / code ${data.code} / msg ${data.msg || ""}`)
  }

  return { success: true, data }
}
