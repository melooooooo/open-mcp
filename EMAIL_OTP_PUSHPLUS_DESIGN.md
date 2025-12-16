# 邮箱验证码发送（PushPlus 优先）设计方案

## 1. 目标与范围
- 在现有邮箱注册/登录中，引入邮件验证码发送（OTP），优先使用 PushPlus，失败或未配置时回退 Nodemailer。
- 支持验证码生成、发送、验证、过期处理；沿用现有 OTP 前端交互。
- 影响范围：认证（Better Auth email OTP）、邮件发送模块（@repo/email）、配置/env、监控与日志。

## 2. 现状与依赖
- 认证：`apps/web/src/lib/auth.ts` 使用 Better Auth `emailOTP`，调用 `sendMagicCodeEmail`。
- 邮件：`packages/email/index.ts` 有 Nodemailer（dev MailHog / prod SMTP），模板 `AWSVerifyEmail`。
- 数据：Better Auth 自带验证码存储/校验，无需新增表；已有 `verification` 等 schema。
- 前端：已有 OTP 输入组件/表单，可复用。
- 外部：可用 PushPlus 邮件渠道作为首选，无配置则保持现有 Nodemailer 行为。

## 3. 设计原则
- 优先级：PushPlus（若配置）→ Nodemailer（SMTP/MailHog）。
- 透明回退：PushPlus 失败自动回退，不影响用户体验。
- 配置驱动：通道、凭据均走 env；无配置保持当前行为。
- 安全：验证码长度/有效期沿用现状（6 位，10 分钟）；Prod 不打印验证码。
- 观测：发送成功/失败记录日志；后续可加 metrics。

## 4. 功能流程
1) 用户提交邮箱请求验证码：生成 6 位 OTP（Better Auth），优先 PushPlus 发送 HTML（含验证码），失败/未配 token 回退 Nodemailer，前端提示“验证码已发送”。
2) 用户输入验证码：调用 verify OTP，成功则登录/注册，失败提示重试。
3) 过期与重发：OTP 有效期 10 分钟，必要时支持重发（沿用现有逻辑）。
## 5. 模块设计
- 发送层（@repo/email）：
  - `sendMagicCodeEmail({ to, code, subject })`：内部按优先级选择通道。
  - `sendPushplusEmail({ token?, subject, content, channel?, template?, apiBase? })`：默认 `channel=mail`，`template=html`，`apiBase=https://www.pushplus.plus/send`。
- 调用层（Better Auth 插件）：
  - `emailOTP.sendVerificationOTP({ email, otp, type })` 直接调用 `sendMagicCodeEmail`，无需改调用方式。

## 6. 配置与环境变量
- PushPlus：`PUSHPLUS_TOKEN`（启用必填）、`PUSHPLUS_CHANNEL`(默认 mail)、`PUSHPLUS_TEMPLATE`(默认 html)、`PUSHPLUS_URL`(默认 https://www.pushplus.plus/send)。
- SMTP（现有）：`MAIL_HOST/MAIL_PORT/MAIL_USER/MAIL_PASSWORD/MAIL_FROM`。
- 其他：`NODE_ENV`、本地 MailHog 配置保持不变。需在 `.env.example` 补充 PushPlus 占位。

## 7. 安全与合规
- Prod 禁止打印验证码；日志避免泄露验证码。
- 发信域名保持 SPF/DMARC；PushPlus token 妥善保密。
- 速率限制：可在 Better Auth 层按邮箱/IP 限频（后续可加）。

## 8. 错误处理与回退
- PushPlus 调用失败（HTTP 非 200 或 code≠200）→ 捕获后回退 Nodemailer。
- Nodemailer 失败：向上抛错，前端提示“发送失败”，可重试。
- 记录关键错误日志，不在错误日志中包含验证码。
## 9. 监控与测试建议
- 单测/集成：Mock PushPlus 200/非 200/异常验证回退；SMTP 成功/失败路径；OTP 生存期与重复请求。
- 手测：
  - Dev 未配 PushPlus → MailHog 收信。
  - Dev 配 PushPlus，关闭 MailHog → 走 PushPlus。
  - Staging/Prod 配 PushPlus+SMTP，验证优先级与退避。
- 未来可加 metrics：发送成功率、耗时、失败原因。

## 10. 渐进式上线计划
1) 补充 env 示例并在部署环境配置 PushPlus token。
2) 上线 PushPlus 客户端与发送优先级逻辑。
3) Staging 实测收信与回退路径。
4) Prod 上线，观察日志/报警；必要时删除 token 退回 SMTP。

## 11. 待确认问题
- PushPlus 邮箱收件人是否已在 PushPlus 平台绑定？
- 是否需要多语言标题/模板？目前复用现有模板。
- 是否需要防刷限频（邮箱 60s 内限次）？可后续在 Better Auth 层加。
