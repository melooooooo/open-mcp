import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import AWSVerifyEmail from "./emails/aws-verify-email";
import VerifySubscriptionEmail from "./emails/verify-subscription";

const isDevelopment = process.env.NODE_ENV === "development";

// 检查是否配置了真实邮件服务
const hasRealMailConfig = process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASSWORD;

// 开发环境使用 MailHog（如果没有配置真实邮件服务）
const devTransporter: Transporter = nodemailer.createTransport({
  host: "localhost",
  port: 1025,
  secure: false,
  auth: {
    user: "test",
    pass: "test",
  },
});

// 生产环境使用 Nodemailer
const prodTransporter: Transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

// 如果开发环境配置了真实邮件服务，则使用真实邮件服务
const useRealMailInDev = isDevelopment && hasRealMailConfig;

interface SendMagicLinkParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface SendAwsVerificationEmailParams {
  to: string;
  verificationCode: string;
}

export async function sendAwsVerificationEmail(params: SendAwsVerificationEmailParams) {
  const { to, verificationCode } = params;
  const subject = "OpenMCP 账户验证";

  // 开发环境打印验证码到控制台
  if (isDevelopment) {
    console.log(`\n========================================`);
    console.log(`📧 验证码发送到: ${to}`);
    console.log(`🔑 验证码: ${verificationCode}`);
    console.log(`========================================\n`);
  }

  const emailHtml = await render(AWSVerifyEmail({ verificationCode }));
  const emailText = `您的 OpenMCP 验证码是：${verificationCode}。此验证码将在 10 分钟后过期。`;

  const transporter = isDevelopment ? devTransporter : prodTransporter;

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || "OpenMCP <noreply@julianshuke.com>",
      to,
      subject,
      html: emailHtml,
      text: emailText,
    });
    return { success: true };
  } catch (error) {
    // 开发环境中如果邮件发送失败（如 MailHog 未运行），仍然返回成功
    // 验证码已经打印到控制台
    if (isDevelopment) {
      console.warn("开发环境邮件发送失败（MailHog 可能未运行），但验证码已打印到控制台");
      return { success: true };
    }
    console.error(`${isDevelopment ? "开发" : "生产"}环境发送验证邮件失败:`, error);
    throw new Error("发送验证邮件失败");
  }
}

export async function sendMagicLink(params: SendMagicLinkParams) {
  const { to, subject, html, text } = params;

  if (isDevelopment) {
    // 开发环境使用 MailHog
    try {
      await devTransporter.sendMail({
        from: process.env.MAIL_FROM || "OpenMCP <noreply@julianshuke.com>",
        to,
        subject,
        html,
        text,
      });
      return { success: true };
    } catch (error) {
      console.error("开发环境发送邮件失败:", error);
      throw new Error("发送邮件失败");
    }
  } else {
    // 生产环境使用 Nodemailer
    try {
      await prodTransporter.sendMail({
        from: process.env.MAIL_FROM || "OpenMCP <noreply@julianshuke.com>",
        to,
        subject,
        html,
        text,
      });
      return { success: true };
    } catch (error) {
      console.error("生产环境发送邮件失败:", error);
      throw new Error("发送邮件失败");
    }
  }
}

interface SendValidationEmailParams {
  to: string;
  subject: string;
  code: string
}

export async function sendValidationEmail(params: SendValidationEmailParams) {
  const { to, subject, code } = params;

  if (isDevelopment) {
    await devTransporter.sendMail({
      from: process.env.MAIL_FROM || "OpenMCP <noreply@julianshuke.com>",
      to,
      subject,
      html: `<p>您的验证码是：${code}</p>`,
      text: `您的验证码是：${code}`,
    });
  } else {
    await prodTransporter.sendMail({
      from: process.env.MAIL_FROM || "OpenMCP <noreply@julianshuke.com>",
      to,
      subject,
      html: `<p>您的验证码是：${code}</p>`,
      text: `您的验证码是：${code}`,
    });
  }
}

interface SendMagicLinkEmailParams {
  to: string;
  code: string;
  subject: string;
  magicLink: string;
}

export async function sendMagicLinkEmail(params: SendMagicLinkEmailParams) {
  const { to, magicLink, code, subject } = params;
  // const subject = "OpenMCP 一键登录";

  const emailHtml = await render(AWSVerifyEmail({ magicLink }));
  const emailText = `点击此链接登录 OpenMCP：${magicLink}。此链接将在 10 分钟后过期。`;

  const transporter = isDevelopment ? devTransporter : prodTransporter;

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || "OpenMCP <noreply@julianshuke.com>",
      to,
      subject,
      html: emailHtml,
      text: emailText,
    });
    return { success: true };
  } catch (error) {
    console.error(`${isDevelopment ? "开发" : "生产"}环境发送魔法链接邮件失败:`, error);
    throw new Error("发送魔法链接邮件失败");
  }
}

/**
 * 只发送验证码的邮件（Resend 优先，当前不做其他回退）
 */
export async function sendMagicCodeEmail(params: {
  to: string;
  code: string;
  subject: string;
}) {
  const { to, code, subject } = params;
  const emailHtml = await render(AWSVerifyEmail({ verificationCode: code, subject }));

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    throw new Error("Resend 未配置：请设置 RESEND_API_KEY 和 RESEND_FROM");
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html: emailHtml,
        text: emailHtml,
      }),
    });

    const data = await res.json();
    if (!res.ok || data?.error) {
      const message = data?.error?.message || `Resend 发送失败: HTTP ${res.status}`;
      throw new Error(message);
    }

    console.info(`[sendMagicCodeEmail] 通过 Resend 发送验证码到 ${to}，消息ID: ${data?.id || "unknown"}`);
    return { success: true };
  } catch (error) {
    console.error("Resend 发送验证码失败:", error);
    throw new Error("发送验证邮件失败，请稍后重试");
  }
}

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${process.env.BETTER_AUTH_URL}/auth/verify?token=${token}`;
  const unsubscribeUrl = `${process.env.BETTER_AUTH_URL}/web/unsubscribe?email=${encodeURIComponent(to)}&token=${token}`;
  const subject = "验证您的邮箱订阅";

  const html = await render(
    VerifySubscriptionEmail({
      verifyUrl,
      unsubscribeUrl,
    })
  );
  const transporter = isDevelopment ? devTransporter : prodTransporter;
  await transporter.sendMail({
    from: process.env.MAIL_FROM || "OpenMCP <noreply@julianshuke.com>",
    to,
    subject,
    html: html,
    text: html,
  });
}