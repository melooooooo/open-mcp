import { db } from "@repo/db"
import * as schema from "@repo/db/schema"
import { sendMagicCodeEmail } from "@repo/email"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { phoneNumber } from "better-auth/plugins"
import { admin } from "better-auth/plugins"
import { emailOTP } from "better-auth/plugins"
import * as tencentcloud from "tencentcloud-sdk-nodejs"

const isProd = process.env.NODE_ENV === "production"

// 供社交登录回调使用，未配置时回落到 Better Auth 默认逻辑
const authBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.AUTH_BASE_URL || process.env.BETTER_AUTH_BASE_URL
const resolvedAuthBaseUrl = authBaseUrl
  ? new URL('/api/auth', authBaseUrl).toString().replace(/\/$/, '')
  : undefined

export const auth = betterAuth({
  baseURL: resolvedAuthBaseUrl,
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: false,
    schema
  }),
  emailAndPassword: {
    enabled: true
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  socialProviders: (() => {
    const providers: Record<string, { clientId: string; clientSecret: string }> = {}

    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      providers.google = {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }
    }

    return providers as any
  })(),
  plugins: [
    admin(),
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }, request) => {
        // 这里实现发送短信验证码的逻辑
        // 可以使用第三方短信服务，如阿里云、腾讯云等
        console.info(`发送验证码 ${code} 到手机号 ${phoneNumber}`);
        // 实际项目中需要替换为真实的短信发送逻辑
        if (isProd) {
          // 生产环境下才发送短信
          await sendSmsCodeByTecent(phoneNumber, code)
        }
      },
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => {
          return `${phoneNumber}@my-site.com`;
        }
      }
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "sign-in") {
          const existingUser = await db.query.user.findFirst({
            where: (table, { eq }) => eq(table.email, email)
          })

          if (!existingUser) {
            throw new Error("该邮箱未注册，请先注册")
          }
        }

        // 实现发送验证码的逻辑
        console.info(`发送验证码 ${otp} 到邮箱 ${email}`);
        await sendMagicCodeEmail({
          to: email,
          subject: "OpenMCP 登录验证码",
          code: otp,
        })
      },
    }),
  ],
}) as ReturnType<typeof betterAuth>



async function sendSmsCodeByTecent(phone: string, code: string) {

  const SmsClient = tencentcloud.sms.v20210111.Client;
  // 实例化要请求产品(以cvm为例)的client对象
  const client = new SmsClient({
    // 为了保护密钥安全，建议将密钥设置在环境变量中或者配置文件中，请参考本文凭证管理章节。
    // 硬编码密钥到代码中有可能随代码泄露而暴露，有安全隐患，并不推荐。
    credential: {
      secretId: process.env.COS_SECERT_ID,
      secretKey: process.env.COS_SECERT_KEY,
    },
    // 产品地域
    region: "ap-nanjing",
    // 可选配置实例
    profile: {
      signMethod: "TC3-HMAC-SHA256", // 签名方法
      httpProfile: {
        reqMethod: "POST", // 请求方法
        reqTimeout: 30, // 请求超时时间，默认60s
      },
    },
  })
  // 通过client对象调用想要访问的接口（Action），需要传入请求对象（Params）以及响应回调函数
  // 即：client.Action(Params).then(res => console.log(res), err => console.error(err))
  // 如：查询云服务器可用区列表
  try {
    const resp = await client.SendSms({
      PhoneNumberSet: [phone],
      SmsSdkAppId: process.env.COS_SMS_APPID ?? "",
      TemplateId: process.env.COS_SMS_TEMPLATEID ?? "",
      SignName: process.env.COS_SMS_SIGN_NAME ?? "",
      TemplateParamSet: [code + "", "5"],
    })
    console.warn("resposne:", resp)
    return { code: 200, data: { ...resp } }
  } catch (error) {
    console.warn("error:", JSON.stringify(error));
    return { code: 500, msg: JSON.stringify(error) }
  }
}
