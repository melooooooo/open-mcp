# 前后端分离登录架构通用方案

版本：v1.0  
日期：2026-05-30  
适用场景：Web、H5、App、小程序、管理后台共用一套后端 API 的项目

---

## 1. 核心结论

前后端分离项目不要把“登录方式”和“用户”绑死在一起。长期可复用的做法是：

1. 后端维护唯一的 `user`，代表业务用户。
2. 各登录渠道只是一种 `identity/account`，例如邮箱、手机号、Google、微信小程序 openid、公众号 openid、Apple、GitHub。
3. Web 端优先使用 HttpOnly Cookie Session。
4. 小程序、App、CLI 这类非浏览器客户端使用 `Authorization: Bearer <accessToken>`。
5. 所有业务接口只关心统一的 `currentUser`，不关心用户是用什么方式登录的。

一句话模型：

```text
Client login method -> Auth API -> user + identity + session -> Business API currentUser
```

---

## 2. 推荐架构

```text
┌───────────────────────┐
│ Web / Admin            │
│ HttpOnly Cookie        │
└───────────┬───────────┘
            │
┌───────────▼───────────┐
│ Auth Core              │
│ /api/auth/*            │
│ /api/mobile/auth/*     │
│ /api/mp/auth/*         │
└───────────┬───────────┘
            │
┌───────────▼───────────┐
│ User System            │
│ user                   │
│ account / identity     │
│ session                │
│ refresh_token          │
└───────────┬───────────┘
            │
┌───────────▼───────────┐
│ Business API           │
│ getCurrentUser(req)    │
│ RBAC / ownership       │
└───────────▲───────────┘
            │
┌───────────┴───────────┐
│ Mini Program / App     │
│ Bearer Access Token    │
└───────────────────────┘
```

推荐分三层：

| 层 | 职责 | 不应该做什么 |
|---|---|---|
| Auth Core | 登录、注册、绑定、发 session/token、刷新、登出 | 不写业务查询 |
| Identity Layer | 维护用户和第三方身份的映射 | 不把 openid 直接散落在业务表 |
| Business API | 通过 `getCurrentUser` 获取登录用户并执行业务权限 | 不自己解析各种登录方式 |

---

## 3. 数据模型

### 3.1 `user`

`user` 是业务主体，所有收藏、订单、点赞、权限都关联它。

```text
user
- id
- name
- avatar_url
- email
- phone
- role
- status
- created_at
- updated_at
- last_login_at
```

设计原则：

- `user.id` 永远是业务系统里的用户 ID。
- 不要把 `openid` 当用户 ID。
- 不要让业务表关联 `email`、`phone`、`openid`。
- 邮箱和手机号可以为空，因为很多小程序用户只有微信身份。

### 3.2 `account` / `identity`

用于保存“这个用户通过什么身份登录”。

```text
account
- id
- user_id
- provider               # email | phone | google | wechat_mini | wechat_mp | apple
- provider_account_id    # email address | phone | google sub | openid
- union_id               # 微信体系可选
- access_token           # 第三方访问令牌，可选
- refresh_token          # 第三方刷新令牌，可选
- expires_at
- created_at
- updated_at
```

唯一索引：

```text
unique(provider, provider_account_id)
```

微信场景建议：

- 小程序 `openid`：只在当前小程序内唯一。
- 公众号 `openid`：只在当前公众号内唯一。
- 开放平台 `unionid`：同一开放平台主体下跨应用唯一。
- 如果能拿到 `unionid`，优先用它做跨端账号合并依据。
- 如果拿不到 `unionid`，只能通过用户主动绑定手机号/邮箱/扫码确认来合并账号。

### 3.3 `session`

Web Cookie 场景使用。

```text
session
- id
- user_id
- token_hash
- expires_at
- ip_address
- user_agent
- created_at
- updated_at
```

### 3.4 `client_session` / `refresh_token`

小程序、App、CLI 使用。

```text
client_session
- id
- user_id
- client_type            # mini_program | ios | android | cli
- device_id
- refresh_token_hash
- expires_at
- revoked_at
- last_used_at
- created_at
```

推荐令牌时长：

| Token | 推荐时长 | 存放位置 | 用途 |
|---|---:|---|---|
| access token | 15 分钟到 2 小时 | 小程序 storage / App secure storage | 调业务 API |
| refresh token | 30 到 90 天 | 小程序 storage / App secure storage | 换新 access token |
| Web session cookie | 7 到 30 天 | HttpOnly Secure Cookie | Web 登录态 |

---

## 4. 各端登录策略

### 4.1 Web / 管理后台

推荐：HttpOnly Cookie Session。

原因：

- 浏览器自动携带 Cookie。
- SSR、Server Components、Route Handler 都容易读取 session。
- HttpOnly 可以避免 token 被 XSS 直接读走。
- 管理后台权限判断更直接。

Cookie 配置建议：

```text
httpOnly: true
secure: true
sameSite: "lax"
path: "/"
domain: 按部署域名决定，通常不跨主域共享
```

如果前端和 API 分属不同子域：

```text
Web: https://www.example.com
API: https://api.example.com
```

两种可选做法：

1. 推荐：Web 服务端做 BFF，浏览器只请求 `www.example.com/api/*`，BFF 转发到后端。
2. 次选：跨域 Cookie，前端 `credentials: "include"`，后端严格配置 CORS 和 CSRF。

### 4.2 微信小程序

推荐：`wx.login()` 换取业务 token。

流程：

```text
1. 小程序调用 wx.login() 拿 code
2. POST /api/mp/auth/wechat-login { code }
3. 服务端请求微信 code2Session，拿 openid / unionid / session_key
4. 用 provider=wechat_mini + openid 查 account
5. 找到则登录对应 user
6. 找不到则创建 user + account
7. 返回 accessToken + refreshToken + user
8. 后续 wx.request 携带 Authorization: Bearer <accessToken>
```

小程序端不要依赖 Web Cookie。`wx.request` 的 Cookie 行为和浏览器不同，不适合作为跨项目标准。

小程序请求封装标准：

```js
wx.request({
  url,
  method,
  data,
  header: {
    "content-type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  },
})
```

access token 过期处理：

```text
业务接口返回 401 TOKEN_EXPIRED
-> 请求 /api/mp/auth/refresh
-> 刷新成功后重放原请求
-> 刷新失败则清空本地 token，回到游客态/登录页
```

### 4.3 App / H5 / CLI

App 和 CLI 也使用 Bearer token。H5 视运行环境决定：

| 客户端 | 推荐方式 |
|---|---|
| Next.js Web | HttpOnly Cookie |
| 管理后台 | HttpOnly Cookie + RBAC |
| 微信小程序 | Bearer token |
| 原生 App | Bearer token + secure storage |
| CLI | Bearer token 或 API Key |
| 第三方开放 API | API Key / OAuth Client Credentials |

---

## 5. API 契约

### 5.1 统一响应格式

所有 API 建议使用同一响应结构：

```json
{
  "code": "OK",
  "message": "success",
  "data": {},
  "requestId": "req_xxx"
}
```

错误响应：

```json
{
  "code": "UNAUTHORIZED",
  "message": "请先登录",
  "data": null,
  "requestId": "req_xxx"
}
```

常用错误码：

| code | HTTP | 含义 |
|---|---:|---|
| `OK` | 200 | 成功 |
| `BAD_REQUEST` | 400 | 参数错误 |
| `UNAUTHORIZED` | 401 | 未登录 |
| `TOKEN_EXPIRED` | 401 | access token 过期 |
| `FORBIDDEN` | 403 | 已登录但无权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT` | 409 | 重复绑定或状态冲突 |
| `RATE_LIMITED` | 429 | 请求过快 |
| `INTERNAL_ERROR` | 500 | 服务端错误 |

### 5.2 推荐认证接口

Web 可以复用认证库自带路由，例如 Better Auth 的 `/api/auth/*`。

小程序/App 建议显式提供：

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/mp/auth/wechat-login` | 微信小程序登录 |
| POST | `/api/mp/auth/refresh` | 刷新 access token |
| POST | `/api/mp/auth/logout` | 登出并吊销 refresh token |
| GET | `/api/mp/me` | 当前用户 |
| PATCH | `/api/mp/me` | 修改当前用户资料 |

请求示例：

```json
POST /api/mp/auth/wechat-login
{
  "code": "wx_login_code",
  "profile": {
    "nickname": "可选",
    "avatarUrl": "可选"
  }
}
```

响应示例：

```json
{
  "code": "OK",
  "message": "success",
  "data": {
    "accessToken": "eyJ...",
    "expiresIn": 3600,
    "refreshToken": "rt_...",
    "user": {
      "id": "usr_xxx",
      "name": "同学",
      "avatarUrl": ""
    }
  },
  "requestId": "req_xxx"
}
```

### 5.3 后端统一取用户

业务代码只调用一个函数，例如：

```ts
export async function getCurrentUser(request: Request) {
  const cookieUser = await getUserFromCookie(request)
  if (cookieUser) return cookieUser

  const bearerUser = await getUserFromBearer(request)
  if (bearerUser) return bearerUser

  return null
}
```

业务接口里：

```ts
const user = await getCurrentUser(request)
if (!user) return fail("UNAUTHORIZED", "请先登录", 401)
```

这样 Web、后台、小程序、App 都能共用业务 API，不需要每个接口知道不同登录方式。

---

## 6. 账号绑定与合并

账号合并是前后端分离项目里最容易踩坑的地方。原则是：自动合并要保守，主动绑定要明确。

### 6.1 可以自动合并的情况

| 场景 | 是否自动合并 |
|---|---|
| 同一 OAuth provider 返回相同 subject/openid | 可以 |
| 微信返回相同 unionid | 可以 |
| 用户已登录时绑定新的 provider | 可以，但要用户确认 |
| 同邮箱但未验证 | 不要 |
| 同手机号但未验证 | 不要 |
| 只有昵称相同 | 绝对不要 |

### 6.2 绑定流程

推荐流程：

```text
1. 用户已登录
2. 点击绑定微信/手机号/邮箱
3. 完成对应渠道验证
4. 服务端检查该 identity 是否已绑定其他 user
5. 未绑定：绑定到当前 user
6. 已绑定：返回 CONFLICT，引导用户换账号或走人工合并
```

### 6.3 小程序和 Web 同一用户

推荐方案：

1. 小程序先允许微信快捷登录，创建独立用户。
2. 后续提供“绑定手机号/邮箱”。
3. 如果手机号/邮箱已属于 Web 用户，要求短信/邮箱验证码确认。
4. 确认后把小程序 `account` 迁移到原 Web 用户。

不要只因为微信昵称或头像相同就合并。

---

## 7. 权限模型

认证解决“你是谁”，授权解决“你能做什么”。

建议至少支持两层：

| 层 | 用途 |
|---|---|
| role | admin、user、member |
| ownership | 资源是否属于当前用户 |

示例：

```ts
if (!user) return fail("UNAUTHORIZED", "请先登录", 401)
if (user.role !== "admin") return fail("FORBIDDEN", "没有权限", 403)
```

资源归属：

```ts
const item = await db.query.items.findFirst({ where: eq(items.id, id) })
if (item.userId !== user.id && user.role !== "admin") {
  return fail("FORBIDDEN", "没有权限", 403)
}
```

管理后台必须服务端校验角色，前端隐藏按钮只能当体验优化。

---

## 8. 安全基线

### 8.1 Web Cookie

- Cookie 必须 `HttpOnly`。
- 生产环境必须 `Secure`。
- 默认 `SameSite=Lax`。
- 涉及跨站 Cookie 时必须考虑 CSRF。
- 登录、绑定、修改密码等接口要加频率限制。

### 8.2 Bearer Token

- access token 短有效期。
- refresh token 只保存 hash。
- refresh token 可吊销。
- refresh token 旋转：每次 refresh 返回新的 refresh token，旧 token 作废。
- token 泄露后可按设备登出。

### 8.3 小程序

- 不信任前端传来的 openid、unionid。
- 必须由服务端用 `code` 向微信换取 openid。
- 不在小程序端保存长期敏感密钥。
- `session_key` 不返回给前端，除非确有加解密需求。

### 8.4 审计与风控

建议记录：

```text
auth_event
- id
- user_id
- action              # login | logout | refresh | bind | unbind | failed_login
- provider
- client_type
- ip_address
- user_agent
- metadata
- created_at
```

最低要能回答：

- 谁在什么时候登录了？
- 用什么方式登录？
- 从哪个客户端登录？
- 是否有异常失败？
- 某个 refresh token 是否已被吊销？

---

## 9. 前端实现标准

### 9.1 Web

Web 前端不要自己保存 access token。推荐：

- 登录由认证库处理。
- 浏览器拿 HttpOnly Cookie。
- 客户端通过 `/api/auth/session` 或 hooks 获取用户展示信息。
- SSR/Route Handler 在服务端读取 session。

### 9.2 小程序

小程序本地维护：

```text
accessToken
refreshToken
user
expiresAt
```

请求封装必须支持：

- 自动加 Authorization。
- 统一 timeout。
- 统一错误结构。
- 401 自动 refresh。
- refresh 失败清空登录态。
- 支持游客态。

小程序 UI 状态：

| 状态 | UI |
|---|---|
| 游客 | 可以浏览公开内容，收藏/点赞显示登录引导 |
| 已登录 | 展示收藏、点赞、个人资料 |
| token 过期但 refresh 成功 | 用户无感 |
| refresh 失败 | 回到游客态或登录页 |

---

## 10. 当前仓库落地建议

当前仓库已经具备：

- Web 端 Better Auth。
- `user` / `session` / `account` / `verification` 表。
- `/api/auth/*` Web 认证路由。
- `/api/mp/*` 小程序 BFF API。
- 统一响应格式 `code/message/data/requestId`。

建议下一阶段按以下顺序做：

### 10.1 抽象统一认证读取

把 `apps/web/src/app/api/mp/_shared/response.ts` 里的 `getCurrentUser` 升级为通用函数：

```text
getCurrentUser(request)
- 先读 Better Auth Cookie
- 再读 Authorization Bearer
- 返回统一 user
```

然后所有 REST API、BFF API 都复用它。

### 10.2 小程序登录

新增接口：

```text
POST /api/mp/auth/wechat-login
POST /api/mp/auth/refresh
POST /api/mp/auth/logout
```

如果继续使用 Better Auth，建议仍然把小程序登录当成一个独立 adapter：

- Web：Better Auth Cookie Session。
- Mini Program：自建 access/refresh token，最终映射到同一 `user`。
- 业务 API：只看 `getCurrentUser`。

### 10.3 身份表选择

当前已有 Better Auth `account` 表。可以优先复用它存微信身份：

```text
providerId = "wechat_mini"
accountId = openid
userId = user.id
```

如果后续多项目、多租户、多微信应用很多，再单独拆 `user_identity` 表。

### 10.4 用户字段补齐

建议补字段：

```text
user.nickname
user.avatar_url
user.last_login_at
```

微信 openid 不建议直接放在 `user` 表，除非项目确定永远只有一个微信应用。

### 10.5 小程序前端恢复登录能力

当前小程序公测版隐藏了收藏/点赞。实现登录后再恢复：

- 职位详情收藏。
- 内推详情收藏。
- 经验详情点赞。
- 我的收藏/我的点赞。
- 用户资料编辑。

### 10.6 生产检查清单

上线前检查：

- Web Cookie 在生产环境是 `Secure + HttpOnly`。
- 小程序合法域名包含 API 域名。
- 小程序 token refresh 能正常重放请求。
- 登录、刷新、发验证码有 rate limit。
- 登出会吊销 refresh token。
- 角色权限在服务端校验。
- 所有 401/403 有稳定错误码。
- 日志包含 `requestId`。

---

## 11. 新项目复用模板

新项目可以直接按这个顺序落地：

1. 建 `user` 表。
2. 建 `account/identity` 表，唯一索引 `(provider, provider_account_id)`。
3. Web 端接 Cookie Session。
4. 小程序/App 端接 Bearer access token + refresh token。
5. 写统一 `getCurrentUser(request)`。
6. 所有业务 API 只依赖 `currentUser`。
7. 写 `requireUser`、`requireAdmin`、`requireOwner` 三个权限 helper。
8. 写统一响应格式。
9. 做游客态 UI。
10. 最后补账号绑定、审计日志、风控。

默认技术选择：

| 场景 | 默认方案 |
|---|---|
| Web 登录 | Cookie Session |
| 小程序登录 | `wx.login` + Bearer token |
| App 登录 | Bearer token |
| 管理后台 | Cookie Session + role guard |
| 第三方 API | API Key |
| 跨端账号合并 | verified email / phone / unionid / 主动绑定 |
| 业务权限 | `user.id` ownership + role |

这个方案的重点不是某个认证库，而是边界清晰：登录方式可以不断增加，业务系统永远只认同一个 `user.id`。
