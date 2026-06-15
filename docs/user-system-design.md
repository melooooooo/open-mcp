# 用户系统设计文档

版本：v1.0  
日期：2026-05-30  
状态：现状分析 + 规划  

---

## 1. 概述

本文档定义"银行帮"及 OpenMCP 平台的用户系统完整设计，包括 Web 端和小程序端的用户注册、登录、认证、个人中心、数据关联等全部用户相关功能。文档基于现有代码实现进行分析，在此基础上规划缺失功能和优化方向。

### 1.1 技术栈

| 层 | 技术选型 | 说明 |
|---|---|---|
| 前端框架 | Next.js 15 + React 19 | App Router, Server Components |
| UI 组件 | shadcn/ui + Tailwind CSS 4 | 基于 Radix UI |
| API 层 | tRPC + Better Auth REST | tRPC 用于业务 API，Better Auth 处理认证路由 |
| 认证 | Better Auth 1.2.12 | JWT Session (30天), 支持 OAuth/Email/Phone |
| 数据库 | PostgreSQL (Drizzle ORM + Supabase) | Drizzle 管理表结构，部分数据存在 Supabase 托管表 |
| 包管理 | pnpm monorepo (Turborepo) | apps/web, apps/mini-program, packages/* |
| 部署 | Docker + Dokploy (主) / Vercel (备) | GitHub Actions 构建镜像，Dokploy 自动部署 |

### 1.2 名词定义

| 术语 | 含义 |
|---|---|
| **用户 (User)** | 系统中注册的主体，拥有唯一 email |
| **会话 (Session)** | Better Auth 管理的 JWT，有效期 30 天 |
| **账号 (Account)** | 关联的第三方登录凭证（Google OAuth 等） |
| **验证码 (Verification/OTP)** | 邮箱或手机的一次性验证码，有效期 10 分钟 |
| **个人中心** | 用户查看/编辑自身资料、收藏、点赞、浏览历史的页面 |
| **管理员后台** | `/admin` 下的管理功能，可管理所有用户和应用 |

---

## 2. 现状分析

### 2.1 用户数据模型

#### 2.1.1 核心表：`user`（Drizzle Schema: `packages/db/auth-schema.ts`）

| 字段 | 类型 | 说明 | 必填 |
|---|---|---|---|
| `id` | text (cuid2) | 主键 | ✅ |
| `name` | text | 用户显示名 | ✅ |
| `password` | text | 加密密码（OAuth 用户可为 null） | ❌ |
| `email` | text | 邮箱地址（唯一） | ✅ |
| `emailVerified` | boolean | 邮箱是否已验证 | ✅ |
| `image` | text | 头像 URL | ❌ |
| `phoneNumber` | text | 手机号 | ❌ |
| `phoneNumberVerified` | boolean | 手机号是否已验证 | ✅ |
| `gender` | text | 性别 | ❌ |
| `address` | text | 地址 | ❌ |
| `contactPhone` | text | 联系方式（与 phoneNumber 不同，用于展示） | ❌ |
| `role` | enum(admin,user,member) | 角色 | ✅ |
| `banned` | boolean | 是否封禁 | ✅ |
| `bannedReason` | text | 封禁原因 | ❌ |
| `banExpires` | timestamp | 封禁过期时间 | ❌ |
| `createdAt` | timestamp | 创建时间 | ✅ |
| `updatedAt` | timestamp | 更新时间 | ✅ |

**现状评估**：字段设计基本完整，覆盖了封禁管理。但缺少以下扩展字段：
- ❌ 微信 `openid` / `unionid`（小程序登录关键字段）
- ❌ `nickname`（目前 `name` 兼任显示名，语义不明确）
- ❌ `bio`（个人简介）
- ❌ `city`（城市，目前用 `address` 混用）
- ❌ `lastLoginAt`（最后登录时间，安全审计用）

#### 2.1.2 认证相关表（Better Auth 标准表）

| 表 | 用途 | 关键字段 |
|---|---|---|
| `session` | 登录会话 | token(unique), userId, ipAddress, userAgent, expiresAt |
| `account` | 第三方OAuth绑定 | providerId, accountId, userId, accessToken, refreshToken |
| `verification` | 邮箱/手机验证码 | identifier, value, expiresAt |

#### 2.1.3 用户关联数据表

| 表 | 用途 | 关联关系 |
|---|---|---|
| `userCollections` | 内推职位收藏 | userId → user.id, jobId → scrapedJobs.id |
| `userJobListingCollections` | 招聘职位收藏 | userId → user.id, jobListingId → jobListings.id |
| `userExperienceLikes` | 面经点赞 | userId → user.id, experienceId → financeExperiences.id |
| `apiKeys` | 用户 API 密钥 | userId → user.id |

**现状评估**：收藏/点赞关联已实现，唯一索引防止重复。但缺失：
- ❌ `userBrowsingHistory`（浏览历史表）
- ❌ 收藏/点赞数量未在 user 表冗余存储（每次需 JOIN 查询，影响性能）

### 2.2 认证方式

| 方式 | 实现位置 | 状态 | 生产就绪 |
|---|---|---|---|
| **邮箱 + 密码** | `lib/auth.ts` → `emailAndPassword.enabled` | ✅ 完成 | ✅ |
| **Google OAuth** | `lib/auth.ts` → `socialProviders.google` | ✅ 完成 | ⚠️ 需配置 GOOGLE_CLIENT_ID/SECRET |
| **邮箱验证码** | `lib/auth.ts` → `emailOTP` 插件 | ✅ 完成 | ✅ (依赖 Resend) |
| **手机验证码** | `lib/auth.ts` → `phoneNumber` 插件 + 腾讯云 SMS | ✅ 完成 | ⚠️ 需配置 COS_SECRET_ID/KEY 等 |
| **账号关联** | `account.accountLinking` | ✅ 完成 | ✅ (trustedProviders: google) |
| **微信小程序登录** | 未实现 | ❌ | 需新增 |

### 2.3 已实现的用户页面

#### 2.3.1 认证页面

| 路由 | 组件 | 功能 |
|---|---|---|
| `/auth/sign-in` | `signin-form.tsx` + `email-signin.tsx` + `phone-signin.tsx` | 邮箱/手机/Google 统一登录 |
| `/auth/sign-up` | `signup-form.tsx` | 邮箱注册（密码 + 验证码） |
| `/auth/verify` | (Better Auth 内置) | 验证码校验 |
| `/auth/[pathname]` | `view.tsx` | 通用认证路由（支持重定向） |

#### 2.3.2 个人中心

| 路由 | 功能 | 数据来源 |
|---|---|---|
| `(protected)/user/profile` | 个人资料展示 | `user` 表 |
| `profile/edit-profile-dialog.tsx` | 编辑个人资料 | `user` 表更新 |
| (同上) | 我的收藏（内推） | `userCollections` JOIN `scrapedJobs` |
| (同上) | 我的收藏（招聘） | `userJobListingCollections` + Supabase | 
| (同上) | 我的点赞（面经） | `userExperienceLikes` + Supabase |

#### 2.3.3 管理员后台

| 路由 | 功能 | tRPC Router |
|---|---|---|
| `(protected)/admin/users` | 用户列表、搜索、创建、编辑、删除 | `routers/admin/users.ts` |

### 2.4 数据层架构

```
┌──────────────────────────────────────────────────────┐
│                    apps/web                          │
│  ┌─────────────┐  ┌───────────────┐  ┌────────────┐ │
│  │ Server      │  │ tRPC Client   │  │ Better Auth │ │
│  │ Components  │  │ (React Query) │  │ Client      │ │
│  └──────┬──────┘  └───────┬───────┘  └──────┬─────┘ │
│         │                 │                  │        │
├─────────┼─────────────────┼──────────────────┼────────┤
│         ▼                 ▼                  ▼        │
│  ┌─────────────┐  ┌───────────────┐  ┌────────────┐ │
│  │ Server      │  │ tRPC Router   │  │ Better Auth │ │
│  │ Actions     │  │ (packages/    │  │ Handler     │ │
│  │             │  │  trpc/)       │  │ (/api/auth) │ │
│  └──────┬──────┘  └───────┬───────┘  └──────┬─────┘ │
├─────────┼─────────────────┼──────────────────┼────────┤
│         ▼                 ▼                  ▼        │
│              packages/db (Drizzle ORM)                │
│  ┌──────────────────────────────────────────────┐    │
│  │ database/web/   │ database/admin/  │ schema   │    │
│  │ (用户端查询)     │ (管理端查询)      │ (表定义)  │    │
│  └──────────────────────────────────────────────┘    │
│                         │                            │
│                         ▼                            │
│              PostgreSQL (DATABASE_URL)               │
│         + Supabase 托管表 (job_listings 等)          │
└──────────────────────────────────────────────────────┘
```

### 2.5 当前 Vercel 部署状态

| 配置项 | 状态 |
|---|---|
| `apps/web/vercel.json` | ✅ 已配置 |
| 近期 Vercel 相关 commits | `3a68ade` ~ `72acc59` (调试 Vercel 构建) |
| 当前生产部署方式 | Docker + Dokploy（GitHub Actions 自动部署） |
| Vercel 生产可用性 | ⚠️ 配置中，尚未切换为主部署 |

---

## 3. 功能缺口分析

### 3.1 Web 端缺失功能

| 功能 | 优先级 | 说明 |
|---|---|---|
| 浏览历史 | P1 | 记录用户最近 100 条详情页访问（招聘、面经、内推），支持清空 |
| 个人中心统计 | P1 | 首页展示收藏总数、点赞总数、浏览历史总数 |
| 头像上传 | P1 | 当前仅支持 URL，缺少文件上传功能 |
| 昵称独立字段 | P2 | name 和 nickname 分离，name 用于实名，nickname 用于展示 |
| 手机号解绑/更换 | P2 | 当前无解绑流程 |
| 账号注销 | P2 | 无自助注销功能（仅 admin 可删除） |
| 双因素认证 (2FA) | P3 | TOTP 或备用邮箱 |
| 登录设备管理 | P3 | 查看/下线其他设备会话 |

### 3.2 小程序端缺失功能（依据 MINI_PROGRAM_PRD.md）

| 功能 | 优先级 | 说明 |
|---|---|---|
| **微信登录** | P0 | 使用 `wx.login()` 获取 code，服务端换 token，绑定现有 user 表 |
| **微信 openid/unionid 绑定** | P0 | 在 user 表增加 openid/unionid 字段 |
| **小程序 BFF API** | P0 | 新增 `/api/mp/*` REST 端点，不直接暴露 tRPC |
| 个人中心（小程序版） | P0 | 头像、昵称、城市、联系方式、统计数 |
| 我的收藏（小程序版） | P0 | 复用现有查询逻辑 |
| 我的点赞（小程序版） | P0 | 复用现有查询逻辑 |
| 浏览历史 | P1 | 服务端存储 vs 小程序本地存储（待决策） |
| 反馈提交（小程序版） | P1 | 复用 site_feedbacks 表 |
| 微信分享 | P1 | `onShareAppMessage` 实现 |

### 3.3 架构层面问题

| 问题 | 影响 | 严重程度 |
|---|---|---|
| **数据库混用 Drizzle + Supabase** | `job_listings` 和 `finance_experiences` 数据存在 Supabase 托管表，但 user/session/account 等由 Drizzle 管理。查询时需要在两个数据源之间切换，增加了代码复杂度 | ⚠️ 中 |
| **缺少统一用户服务层** | 用户查询分散在 `database/web/users.ts`、`database/admin/users.ts`、Server Components 直接查询 db、tRPC routers 中。没有统一的 user service，导致逻辑重复 | ⚠️ 中 |
| **用户资料字段混用** | `name` 既作实名又作显示名，`address` 既作地址又作城市，语义不清 | 🔵 低 |
| **无用户活动日志** | 无法追踪用户的关键操作（登录、修改资料、删除收藏等） | 🔵 低 |

---

## 4. 数据库扩展设计

### 4.1 user 表新增字段

```sql
ALTER TABLE "user" ADD COLUMN "nickname" text;                    -- 展示昵称（与 name 分离）
ALTER TABLE "user" ADD COLUMN "bio" text;                         -- 个人简介
ALTER TABLE "user" ADD COLUMN "city" text;                        -- 城市（从 address 拆出）
ALTER TABLE "user" ADD COLUMN "wechat_open_id" text UNIQUE;       -- 微信公众号/小程序 openid
ALTER TABLE "user" ADD COLUMN "wechat_union_id" text;             -- 微信 unionid（跨应用统一ID）
ALTER TABLE "user" ADD COLUMN "last_login_at" timestamp;          -- 最后登录时间
ALTER TABLE "user" ADD COLUMN "collection_count" integer DEFAULT 0;  -- 收藏总数（冗余，加速查询）
ALTER TABLE "user" ADD COLUMN "like_count" integer DEFAULT 0;        -- 点赞总数（冗余，加速查询）
```

### 4.2 新增表：浏览历史

```sql
CREATE TABLE "user_browsing_history" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "content_type" varchar(50) NOT NULL,  -- 'job_listing' | 'experience' | 'referral' | 'job_site'
  "content_id" text NOT NULL,           -- 对应内容表的主键
  "title" text,                          -- 冗余保存标题（内容被删后仍可展示）
  "cover_url" text,                      -- 冗余保存封面（内容被删后仍可展示）
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL -- 重复访问时更新时间
);

CREATE INDEX "idx_browsing_history_user_time" ON "user_browsing_history"("user_id", "updated_at" DESC);
CREATE INDEX "idx_browsing_history_content" ON "user_browsing_history"("user_id", "content_type", "content_id");
```

### 4.3 新增表：用户活动日志（P2）

```sql
CREATE TABLE "user_activity_logs" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "action" varchar(100) NOT NULL,    -- 'login' | 'logout' | 'update_profile' | 'delete_account' | ...
  "ip_address" text,
  "user_agent" text,
  "metadata" jsonb,                   -- 附加信息（如修改了哪些字段）
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "idx_activity_logs_user_time" ON "user_activity_logs"("user_id", "created_at" DESC);
```

### 4.4 收藏/点赞计数同步策略

为确保 `user.collection_count` 和 `user.like_count` 与实际数据一致：

- **写入时同步**：收藏/点赞成功时，`user.collection_count + 1`；取消时 `- 1`
- **定期校准**：可通过定时任务（Inngest）或管理后台手动触发全量校准
- **数据库约束**：`collection_count >= 0`，防止并发导致负数

---

## 5. 接口设计

### 5.1 新增 tRPC Router（Web 端）

```typescript
// packages/trpc/routers/web/users.ts
export const usersRouter = router({
  // 获取当前用户完整信息（含统计）
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    // 返回 user + collectionCount + likeCount + browsingHistoryCount
  }),

  // 更新个人资料
  updateMyProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      nickname: z.string().optional(),
      bio: z.string().optional(),
      gender: z.string().optional(),
      city: z.string().optional(),
      contactPhone: z.string().optional(),
      image: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => { ... }),

  // 获取浏览历史
  getBrowsingHistory: protectedProcedure
    .input(z.object({ page: z.number(), limit: z.number() }))
    .query(async ({ ctx, input }) => { ... }),

  // 清空浏览历史
  clearBrowsingHistory: protectedProcedure.mutation(async ({ ctx }) => { ... }),

  // 删除浏览历史单条
  deleteBrowsingHistoryItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => { ... }),

  // 头像上传
  uploadAvatar: protectedProcedure
    .input(z.object({ file: /* base64 or formData */ }))
    .mutation(async ({ ctx, input }) => {
      // 上传到阿里云 OSS / 腾讯云 COS / R2
      // 返回 URL，更新 user.image
    }),

  // 自助注销
  deleteMyAccount: protectedProcedure.mutation(async ({ ctx }) => {
    // 软删除或硬删除 + 数据清理
  }),
});
```

### 5.2 小程序 BFF API（新增）

小程序不直接调用 tRPC，通过 REST API 中转：

| 方法 | 路径 | 说明 | 对应 tRPC |
|---|---|---|---|
| POST | `/api/mp/auth/wechat-login` | 微信小程序登录 | 新增（wx.login → 换 token） |
| POST | `/api/mp/auth/refresh` | 刷新 token | - |
| GET | `/api/mp/me` | 当前用户信息（含统计） | `users.getMyProfile` |
| PATCH | `/api/mp/me` | 更新个人资料 | `users.updateMyProfile` |
| GET | `/api/mp/me/collections` | 我的收藏（含招聘+内推） | 聚合查询 |
| GET | `/api/mp/me/likes` | 我的点赞（面经） | 聚合查询 |
| GET | `/api/mp/me/history` | 浏览历史 | `users.getBrowsingHistory` |
| DELETE | `/api/mp/me/history` | 清空浏览历史 | `users.clearBrowsingHistory` |

**统一响应格式**：

```json
{
  "code": "OK",
  "message": "success",
  "data": {},
  "requestId": "req_xxx"
}
```

---

## 6. 认证流程设计

### 6.1 Web 端认证（现有，保持不变）

```
注册流程:
  邮箱 + 密码 + 验证码 → POST /api/auth/send-otp → 输入 OTP → POST /api/auth/verify-signup → 创建用户 → JWT Session

登录流程:
  - 邮箱 + 密码 → POST /api/auth/sign-in/email → JWT Session
  - 邮箱 + 验证码 → POST /api/auth/sign-in/email-otp → JWT Session
  - 手机 + 验证码 → POST /api/auth/sign-in/phone → JWT Session
  - Google OAuth → 重定向授权 → 回调 → 创建/关联账号 → JWT Session
```

### 6.2 小程序认证（新增）

```
小程序登录流程:
  1. 前端调用 wx.login() → 获取 code
  2. POST /api/mp/auth/wechat-login { code }
  3. 服务端用 code 向微信服务器换取 openid + unionid
  4. 查找 user 表:
      - 存在 unionid 绑定 → 直接登录，返回 JWT
      - 存在已登录 Web 用户但未绑定 → 引导绑定（需用户确认）
      - 不存在 → 创建新用户，绑定 unionid，返回 JWT
  5. 后续请求携带 JWT（HTTP Header: Authorization: Bearer <token>）

用户绑定流程:
  1. Web 端已登录用户在小程序端请求绑定
  2. 小程序生成绑定二维码，Web 端扫码确认
  3. 确认后将小程序 openid 关联到同一 user
```

---

## 7. 小程序 BFF 架构

```
┌─────────────────┐     REST API      ┌──────────────────────┐
│  微信小程序       │ ────────────────→ │  /api/mp/*           │
│  (原生/uni-app)  │ ←──────────────── │  (Next.js Route)     │
└─────────────────┘     JSON响应       └──────────┬───────────┘
                                                  │
                                    ┌─────────────┼─────────────┐
                                    ▼             ▼             ▼
                              ┌──────────┐ ┌──────────┐ ┌──────────┐
                              │ tRPC     │ │ Better   │ │ Supabase │
                              │ Routers  │ │ Auth     │ │ Client   │
                              └────┬─────┘ └────┬─────┘ └────┬─────┘
                                   │            │            │
                                   └────────────┼────────────┘
                                                ▼
                                          PostgreSQL
```

**关键设计决策**：
- 小程序 BFF 作为一个独立的 Next.js Route Handler 组（`api/mp/`），封装对 tRPC、Better Auth、Supabase 的调用
- BFF 层负责：请求鉴权、字段裁剪、响应格式化、错误码标准化
- 小程序端不直接持有数据库凭据，所有数据访问通过 BFF

---

## 8. 实施路线图

### Phase 1: 架构修复（1 周）

| 任务 | 说明 |
|---|---|
| 创建统一 User Service | 将分散的数据库查询合并到 `packages/db/database/web/users.ts` |
| user 表新增字段 | 执行 DDL：nickname, bio, city, wechat_open_id, wechat_union_id, last_login_at, collection_count, like_count |
| 创建 browsing_history 表 | 执行 DDL + Drizzle Schema 定义 |
| 数据迁移脚本 | 将现有 address 拆分为 address + city（可选） |

### Phase 2: Web 端补充功能（1-2 周）

| 任务 | 说明 |
|---|---|
| 浏览历史记录 | 在招聘详情、面经详情、内推详情页写入浏览记录 |
| 浏览历史页面 | 个人中心新增"浏览历史"Tab |
| 个人中心统计 | 首页展示收藏数、点赞数、浏览历史数 |
| 收藏/点赞计数同步 | 在收藏/点赞 API 中同步更新 user 表的计数字段 |
| 头像上传 | 对接现有 OSS（阿里云/R2），实现头像上传和裁剪 |

### Phase 3: 小程序 BFF（1 周）

| 任务 | 说明 |
|---|---|
| 创建 `/api/mp/*` 路由 | 实现小程序 BFF 层 |
| 微信登录接口 | 对接 `wx.login()` + 微信服务端 API |
| 用户绑定机制 | 小程序扫码绑定 Web 用户 |
| 个人中心 API | me, collections, likes, history 接口 |
| 统一鉴权中间件 | BFF 层 JWT 验证 |

### Phase 4: 小程序端（2-3 周，依据 MINI_PROGRAM_PRD.md）

| 任务 | 说明 |
|---|---|
| 微信登录页面 | 授权获取头像/昵称（或手动填写） |
| 个人中心页面 | 四个 Tab：资料、收藏、点赞、历史 |
| 收藏/点赞互通 | Web 和小程序的收藏/点赞数据共享 |

### Phase 5: 增强功能（按需）

| 任务 | 说明 |
|---|---|
| 手机号解绑/更换 | 解绑流程：验证当前手机 → 换绑新手机 |
| 账号注销 | 自助注销（7 天冷静期 + 数据清理） |
| 用户活动日志 | 关键操作日志记录 |
| 登录设备管理 | 查看/下线其他设备会话 |

---

## 9. 安全与合规

### 9.1 认证安全

- JWT 有效期 30 天，刷新间隔 24 小时（已实现）
- 密码最小长度 ≥ 8 位（Better Auth 默认）
- 验证码 60 秒冷却，24 小时同邮箱 ≤ 20 次（已实现）
- 生产日志不打印验证码明文
- 腾讯云 SMS 密钥不暴露到前端

### 9.2 数据安全

- 用户密码使用 bcrypt 加密（Better Auth 默认）
- 个人联系方式脱敏展示（仅本人可见完整值）
- 软删除优于硬删除（用户注销后保留数据 30 天）

### 9.3 小程序合规

- 微信小程序隐私协议声明数据收集范围（头像、昵称、手机号、城市、收藏、点赞、浏览历史）
- 文件上传限制类型和大小（≤ 5MB）

---

## 10. 未决问题

1. **浏览历史存储位置**：服务端存储 vs 小程序本地存储 vs 两者结合？
   - 建议：服务端存储（Web 和小程序共享），本地缓存加速
2. **微信登录是否必须绑定手机号**？还是仅使用微信头像昵称即可？
   - 建议：首版仅使用微信授权信息，后续可引导绑定手机号
3. **Supabase 托管表是否迁移到 Drizzle 统一管理**？
   - 建议：短期保持现状，中期评估迁移成本
4. **Vercel 部署是否切换为主部署**？
   - 建议：待 Vercel 构建调试完成后再决策

---

## 附录

### A. 相关文档

- [邮箱注册 OTP 设计](./EMAIL_SIGNUP_OTP_DESIGN.md)
- [提交表单认证功能](./SUBMIT_FORM_AUTH_FEATURES.md)
- [小程序 PRD](./MINI_PROGRAM_PRD.md)
- [Better Auth 官方文档](https://www.better-auth.com/)
- [Drizzle ORM 官方文档](https://orm.drizzle.team/)

### B. 关键文件索引

| 文件 | 说明 |
|---|---|
| `packages/db/auth-schema.ts` | 用户/会话/账号/验证码表定义 |
| `packages/db/job-schema.ts` | 收藏/点赞关联表定义 |
| `packages/db/database/web/users.ts` | 用户端数据库操作 |
| `packages/db/database/admin/users.ts` | 管理端数据库操作（含 usersDataAccess） |
| `apps/web/src/lib/auth.ts` | Better Auth 服务端配置 |
| `apps/web/src/lib/auth-client.ts` | Better Auth 客户端 |
| `apps/web/src/app/api/auth/[...all]/route.ts` | Better Auth API 路由 |
| `apps/web/src/app/api/auth/send-otp/route.ts` | 验证码发送接口 |
| `apps/web/src/app/api/auth/verify-signup/route.ts` | 注册验证接口 |
| `apps/web/src/app/(protected)/user/profile/page.tsx` | 个人中心页面 |
| `packages/trpc/routers/admin/users.ts` | 管理后台用户管理 tRPC |
