# 邮箱注册（密码+验证码）+ Google 登录 实施方案 (V3 - No Redis)

## 1. 目标
- 支持用户选择 Google 登录或邮箱注册。
- 邮箱注册流程：邮箱 + 密码 + 邮箱验证码校验后创建账户。
- 验证码发送使用 Resend（已集成），无回退通道（需配置 RESEND_API_KEY/RESEND_FROM 且域名已验证）。
- 防刷策略：保持当前 DB 查询限频/日上限方案（不引入 Redis、不增加 IP 维度）。
- 兼容现有 Better Auth 体系（email/password 已启用，emailOTP 插件存在）。

## 2. 用户流程：注册 (Signup)
1. 用户在注册页选择“邮箱注册”。
2. 输入邮箱 + 密码 → 点击“获取验证码”。
3. 后端预校验：邮箱格式、密码强度（沿用 Better Auth 默认或最小长度要求）、邮箱是否已注册（已注册则提示用登录）。
4. 发送验证码：查询 DB 做限频检查 → 生成 6 位 OTP（有效期 10 分钟）→ 写入 DB → Resend 发送。
5. 前端进入“输入验证码”步骤，展示 60s 倒计时（本地存时间戳，刷新不重置）。
6. 用户输入验证码提交；后端校验 OTP；成功则创建用户（邮箱+密码，邮箱标记已验证）、发 session/JWT。
7. 完成注册，跳转首页。

## 3. 用户流程：登录 (Login)
- 入口：统一登录页，提供 “Google 登录” 与 “邮箱密码登录”。
- Google 登录：保持现有流程；未注册可自动创建账户，已注册可关联/直接登录（Better Auth 配置支持）。
- 邮箱密码登录：输入 Email + Password → Better Auth signIn → 成功发 Session；失败提示“账号或密码错误”。（不涉及验证码登录）。

## 4. 后端设计

### 4.1 依赖
- PostgreSQL：复用 Better Auth `verification` 表；需确保 `identifier`、`created_at` 有索引（必需，以保证限频查询效率）。

### 4.2 接口
A) 发送验证码 `/api/auth/send-otp`
- 入参：{ email, password }
- 流程：
  1) 预校验：邮箱/密码格式；DB 确认用户不存在，否则返回提示“邮箱已注册，请登录”。
  2) 限频（保持现状，不改阈值）：
     - 60s 冷却：`count(*)` on `identifier=email AND created_at > now()-60s`，>0 返回 429。
     - 24h 上限：`count(*)` on `identifier=email AND created_at > now()-24h`，>20 返回 429。
  3) 生成 6 位 OTP，写入 `verification`（identifier=email, value=otp, expiresAt=now+10m）。
  4) 调用 Resend 发送（无回退）。失败→返回错误。

B) 注册校验 `/api/auth/verify-signup`
- 入参：{ email, password, code }
- 流程：
  1) 校验 OTP：查询 `verification` 表（匹配 email+code，未过期）。
     - *若无记录或已过期*：返回“验证码无效或已过期”。
     - *若记录存在但 code 不匹配*：返回“验证码错误”，**不删除**记录（允许重试），**不重置**发送冷却时间。
     - *若匹配*：继续执行注册。
  2) 创建用户：Better Auth 创建（emailVerified=true）。
  3) 清理：删除该邮箱的验证码记录。
  4) 登录：生成 Token/Session。

## 5. 前端交互
- 注册页：
  - Tab/按钮：Google 登录 | 邮箱注册。
  - 表单：邮箱、密码、“获取验证码”按钮、验证码输入框。
  - 发送后：按钮禁用 + 60s 倒计时（localStorage 记录发送时间戳，刷新不重置）。
  - **验证失败处理**：如果用户输入错误的验证码提交，前端提示错误，但**不应重置** 60s 倒计时。用户可以在倒计时结束后申请重发。
  - 错误提示：限频/次数、发送失败、验证码错误/过期、邮箱已注册提示去登录。
- 登录页：说明邮箱密码登录；Google 登录不受 OTP 限制。

## 6. 安全与合规
- 生产日志不打印验证码（开发可选打印需标识）。
- Resend 发件人使用已验证域名 `RESEND_FROM`，确保 SPF/DKIM/DMARC 就绪。
- 密码强度：沿用 Better Auth 默认或加最小长度/字符要求（需在代码配置中落实）。
- 防刷：仅邮箱限频（60s 冷却，24h ≤20 次）按现状保持，不增加 IP 维度。
- 禁止将 `RESEND_API_KEY` 暴露到前端（无 NEXT_PUBLIC 前缀）。

## 7. 配置项（保持现状，可调）
- OTP：长度 6，过期 10 分钟。
- 限频：同邮箱 60s；同邮箱 24h ≤ 20 次。
- Resend：`RESEND_API_KEY`、`RESEND_FROM` 必填。

## 8. 测试计划
- 功能：发送成功；限频命中（60s/日上限）；验证码正确/错误/过期；重复发送；邮箱已存在提示。
- 安全：生产日志不含验证码；缺失 RESEND_* 时发送应失败并暴露配置错误。
- 流程：注册→自动登录；Google 登录回归测试；移动端交互可用性。

## 9. 上线步骤
1) 确认生产 `RESEND_API_KEY`、`RESEND_FROM` 配置，域名已验证。
2) 保持现有限频逻辑并接入发送/校验接口。
3) 前端接入倒计时与错误提示。
4) Staging 联调：真实邮箱收信、验证限频/过期场景。
5) Prod 放量，监控发送失败率与错误率。
