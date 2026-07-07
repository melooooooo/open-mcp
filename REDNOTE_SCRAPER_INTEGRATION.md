# RedNote (小红书) Scraper 接入指南

> 目标：在 open-mcp 仓库中自动化爬取小红书帖子内容。
> 方案：调用 Apify 托管 Actor `actorzlab/rednote-scraper`（底层封装开源库 [`ReaJason/xhs`](https://github.com/ReaJason/xhs)）。

## 关键认知

`actorzlab/rednote-scraper` **不是 GitHub 仓库**，而是 [Apify](https://apify.com) 平台上的一个**托管 Actor（付费爬虫服务）**。"接入"它指的是通过 Apify API 远程调用，而不是把代码 clone 进本仓库。

它的核心价值：小红书每 1–3 个月轮换一次请求签名算法，自写爬虫几乎每月都会失效；该 Actor 跟随上游 `xhs` 在 48 小时内更新签名逻辑，稳定性更高。

- 计费：**$3 / 1000 条成功结果**（按成功计费）
- 输出：标题、正文、作者、点赞/收藏/评论/分享数、图片 CDN URL、视频 URL、话题标签、发布时间、地点

## Actor 的 4 种模式

| mode | 作用 | 必填参数 |
|---|---|---|
| `search` | 按关键词搜帖 | `query` |
| `userPosts` | 拉取某用户全部帖子 | `userUrl` |
| `note` | 单篇帖子详情 | `noteUrl`（需含 `xsec_token`） |
| `profile` | 用户资料 | `userUrl` |

通用可选参数：`maxResults`(1–1000，默认 50)、`cookie`、`includeImages`(默认 true)、`proxyConfiguration`。

## 调用方式概览

Apify Actor 调用本质是三步：**提交输入(JSON)启动 run → 等待跑完 → 从 run 的 dataset 取结果**。

| 接口 | 行为 | 适用场景 |
|---|---|---|
| `run-sync-get-dataset-items` | 同步：启动 + 等完成 + 直接返回数据 | 单次任务、结果 5 分钟内可完成（最省事） |
| `runs`（异步） | 立即返回 runId，自行轮询状态再取数据 | 大批量、长任务 |
| SDK 的 `.call()` | SDK 封装了启动 + 轮询 + 取数据 | Node / Python 项目（推荐） |

---

## 第 1 步：获取 Apify Token

1. 注册 [apify.com](https://apify.com)
2. 右上头像 → **Settings → API & Integrations → Personal API tokens**
3. 复制 token，形如 `apify_api_xxxxx`（免费账号有月度额度，足够验证）

## 第 2 步：获取小红书 Cookie（强烈建议）

不带 cookie 时大部分接口会返回鉴权错误。

1. 浏览器登录 [xiaohongshu.com](https://www.xiaohongshu.com)
2. 打开 DevTools(F12) → Network 标签 → 筛选 XHR
3. 点任意请求 → Headers → 复制完整的 `Cookie` 头的值

> Cookie 不会立即过期，但几天后若出现鉴权错误需要刷新。

## 第 3 步：用 curl 立刻验证（不写代码）

先验证 token 有效、Actor 能返回数据：

```bash
curl -X POST "https://api.apify.com/v2/acts/actorzlab~rednote-scraper/run-sync-get-dataset-items?token=apify_api_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "search",
    "query": "护肤",
    "maxResults": 5,
    "cookie": "你的小红书cookie",
    "proxyConfiguration": { "useApifyProxy": true, "apifyProxyGroups": ["RESIDENTIAL"] }
  }'
```

> 注意：Actor ID 中的 `/` 在 URL 里要写成 `~`，即 `actorzlab~rednote-scraper`。
> 这条命令会同步阻塞直到跑完，然后直接返回 5 条帖子的 JSON 数组。

## 第 4 步：Node 最小脚本（官方 SDK）

```bash
npm i apify-client
```

```javascript
import { ApifyClient } from "apify-client";

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

const run = await client.actor("actorzlab/rednote-scraper").call({
  mode: "search",
  query: "护肤",
  maxResults: 5,
  cookie: process.env.XHS_COOKIE,
  proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
});

const { items } = await client.dataset(run.defaultDatasetId).listItems();
console.log(`拿到 ${items.length} 条`, items[0]);
```

`.call()` 内部已封装"启动 → 轮询 run 状态 → 完成"全过程，你只需在 `run.defaultDatasetId` 上读数据。

## 第 5 步：集成进 open-mcp

### (a) 加依赖

```bash
pnpm --filter web add apify-client
```

### (b) 环境变量（`.env.local`，已 gitignored）

```bash
APIFY_API_TOKEN=apify_api_xxxxx
XHS_COOKIE="完整cookie字符串"
```

### (c) 封装客户端 `apps/web/src/lib/rednote.ts`

```typescript
import { ApifyClient } from "apify-client";

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

export type RednoteMode = "search" | "userPosts" | "note" | "profile";

export async function scrapeRednote(opts: {
  mode: RednoteMode;
  query?: string;
  userUrl?: string;
  noteUrl?: string;
  maxResults?: number;
}) {
  if (!process.env.APIFY_API_TOKEN) throw new Error("APIFY_API_TOKEN 未配置");

  const run = await client.actor("actorzlab/rednote-scraper").call(
    {
      ...opts,
      maxResults: opts.maxResults ?? 50,
      cookie: process.env.XHS_COOKIE,
      includeImages: true,
      proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
    },
    { waitSecs: 300 }, // 最多等 5 分钟
  );

  if (run.status !== "SUCCEEDED") {
    throw new Error(`Apify run 状态异常: ${run.status}`);
  }
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items;
}
```

### (d) 暴露成 tRPC 接口

在 `packages/trpc/routers/web/` 下新建 router，用 `publicProcedure` / `protectedProcedure`，再挂到 `routers/_app.ts`。前端即可通过 `clientApi.rednote.search.useQuery(...)` 调用。

### (e) 自动化定时爬取（可选）

仓库已有 Inngest(`apps/web/src/lib/inngest/`)与 cron webhook(`api/webhook/{daily,weekly,monthly}`)。把 `scrapeRednote()` 挂到 Inngest 定时函数 → 写入 Drizzle 表，即构成完整采集管线。

## 调用层注意事项

1. **同步接口有超时上限**（约 5 分钟）。`maxResults` 很大时改用异步：`client.actor(...).start()` 拿 runId，轮询 `client.run(runId).get()` 直到 `status === "SUCCEEDED"`，再读 dataset。
2. **错误排查**：每次 run 会在 key-value store 写入 `runStats`（条数、错误数）；失败时去 [Apify Console](https://console.apify.com) 看日志。
3. **鉴权失败**多半是 cookie 过期，用 try/catch 触发告警并刷新 cookie。
4. **安全**：token / cookie 仅在服务端（tRPC procedure / Inngest）使用，绝不放进前端。

## 建议执行顺序

1. 第 3 步 curl —— 立刻验证可行性
2. 第 4 步 Node 脚本 —— 验证 SDK 调用
3. 第 5 步 —— 正式集成进仓库

## 合规提示

小红书数据含个人信息，受 PIPL / GDPR 约束，且爬取行为违反其服务条款。本方案仅限品牌监测、市场研究等合法用途，禁止用于骚扰或大规模采集私人数据。
