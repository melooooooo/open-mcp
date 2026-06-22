# 小程序经验详情页显示优化方案

## 1. 背景与结论

当前经验详情页并未真正渲染 Markdown。接口返回正文后，小程序通过 `stripMarkdown()` 删除 Markdown 标记，再将内容按换行拆分为普通 `<text>` 节点。因此标题、加粗、列表、引用、链接和图片等格式都会丢失。

同时，小程序详情接口的正文选择顺序存在错误：

```text
markdown_content -> content_html -> metadata.markdown_source.content
```

这会导致只有历史 Markdown 的文章优先返回 HTML，但接口又把 `contentType` 标记为 `markdown`。小程序既没有解析 HTML，也没有使用 `contentType`，最终可能显示 HTML 标签或完全丢失原始排版。

推荐方案是：**数据库保留 Markdown 作为内容源，服务端统一生成安全 HTML，小程序只负责富文本展示。不要在小程序端自行解析 Markdown。**

## 2. 当前实现与数据现状

### 2.1 当前渲染链路

```text
finance_experiences
  -> GET /api/mp/experiences/[slug]
  -> 返回 content + contentType
  -> 小程序 stripMarkdown(content)
  -> contentLines
  -> 普通 <text> 循环渲染
```

当前实现带来的问题：

- 图片 Markdown 被直接删除。
- 链接只保留文字，目标地址丢失。
- 标题失去层级和视觉样式。
- 加粗、斜体、引用、代码、列表等格式被抹平。
- HTML 正文可能被当成普通文本显示。
- 所有段落使用相同样式，文章层级不清晰。
- 接口返回的 `contentType` 未被小程序使用。

### 2.2 数据字段职责

正文均来自 `finance_experiences` 表：

| 字段 | 类型 | 当前内容 | 建议定位 |
| --- | --- | --- | --- |
| `markdown_content` | `text` | 编辑后的 Markdown | 主 Markdown 内容源 |
| `metadata.markdown_source.content` | `jsonb` 内嵌字符串 | 历史导入的原始 Markdown | 历史备份和迁移来源 |
| `content_html` | `text` | Markdown 转换后的 HTML | 网页和小程序的渲染产物 |

截至方案编写时，对当前配置数据库进行只读检查的结果为：

- 经验总数：50 篇。
- 11 篇包含 `markdown_content`。
- 46 篇包含 `metadata.markdown_source.content`。
- 50 篇包含 `content_html`。
- 38 篇只有历史 Markdown、没有 `markdown_content`。
- 49 篇拥有 Markdown 来源，1 篇只有 HTML。
- 49 篇拥有 `cover_asset_path`，50 篇拥有摘要。

主要图片和链接域名包括：

- `store.yinhangbang.com`
- `mmbiz.qpic.cn`
- `mp.weixin.qq.com`

## 3. 目标架构

### 3.1 内容处理链路

```text
markdown_content（主内容源）
       |
       | 缺失时兼容 metadata.markdown_source.content
       v
服务端 Markdown -> HTML 转换
       |
       v
HTML 白名单清洗和小程序样式规范化
       |
       v
content_html（渲染产物）
       |
       +-> Web 页面渲染
       |
       +-> 小程序 rich-text 渲染
```

核心原则：

1. Markdown 是可编辑的内容源。
2. HTML 是供客户端展示的派生产物。
3. Markdown 转换和安全清洗只在服务端完成。
4. 网页和小程序共用转换规则，避免内容表现不一致。
5. 小程序不再通过正则删除或解析 Markdown。

### 3.2 数据兼容与迁移

无需修改数据库表结构，执行一次兼容迁移即可：

1. 当 `markdown_content` 为空时，将 `metadata.markdown_source.content` 写入 `markdown_content`。
2. 已有 `markdown_content` 的记录不得被历史内容覆盖。
3. 根据最终的 `markdown_content` 重新生成并清洗 `content_html`。
4. 唯一的纯 HTML 文章继续保留，以安全清洗后的 `content_html` 渲染。
5. `metadata.markdown_source` 暂时保留用于审计和回溯，不再参与正常渲染；确认稳定后再考虑废弃。

迁移应先以 dry-run 方式输出待更新数量和内容差异，再执行正式更新。正式迁移应支持事务回滚，并记录无法转换的文章 ID 和 slug。

### 3.3 后续写入约束

新增或编辑文章时，应在同一个服务端写入流程中：

1. 保存 `markdown_content`。
2. 将 Markdown 转换为安全 HTML。
3. 保存 `content_html`。
4. 更新 `updated_at`、`last_edited_by` 和 `last_edited_at`。

不得由客户端直接提交或覆盖最终的 `content_html`。

## 4. 接口调整

### 4.1 推荐响应结构

`GET /api/mp/experiences/[slug]` 增加明确的富文本字段：

```ts
type MiniProgramExperienceDetail = {
  // 其他现有详情字段
  contentHtml: string
  relatedLinks: Array<{ label: string; url: string }>
}
```

字段说明：

- `contentHtml`：已转换、已清洗、可直接交给小程序富文本组件的 HTML。
- `relatedLinks`：从正文提取的安全 HTTPS 链接，用于小程序底部复制卡片。
- `coverAssetPath` 已由现有 mapper 返回，不重复新增。
- 内容来源仅保留在服务端解析结果和迁移报告中，不作为长期公开字段。

### 4.2 服务端选择规则

服务端按以下顺序确定内容源：

```text
markdown_content
  -> metadata.markdown_source.content
  -> content_html
  -> 空正文占位
```

如果来源是 Markdown，先转换为 HTML，再进行安全清洗；如果来源是 HTML，也必须重新执行安全清洗。

迁移期间保留现有 `content` 和 `contentType` 字段，避免已发布的旧版小程序立即失效。新版小程序改用 `contentHtml` 后，再单独安排旧字段废弃。

### 4.3 公共转换模块

将当前散落在网页详情页和 tRPC 编辑接口中的 Markdown 转换、HTML 清洗逻辑抽取为公共服务，至少提供：

```ts
resolveExperienceSource(row): ResolvedExperienceSource
markdownToCanonicalHtml(markdown: string): Promise<string>
sanitizeCanonicalHtml(html: string): string
renderMiniProgramHtml(html: string, options: {
  title?: string
  coverAssetPath?: string
}): { html: string; relatedLinks: Array<{ label: string; url: string }> }
```

规范化逻辑包括：

- 当正文第一个 H1 与页面标题相同时移除该 H1。
- 当正文首图与 `coverAssetPath` 相同，或图片标记为 `cover_image` 时，移除正文中的重复封面。
- 图片统一使用 HTTPS。
- 清除空段落和无意义的连续换行。
- 保留正文语义结构，不通过正则把内容拍平成纯文本。

## 5. HTML 安全与样式规范

### 5.1 HTML 白名单

Canonical 白名单保留 Web 和后续内容可能使用的语义标签：

```text
p, br, h1, h2, h3, h4, h5, h6
span, div, strong, em, del, ins, mark
ul, ol, li
blockquote
a, img
pre, code
hr
table, thead, tbody, tr, th, td
figure, figcaption, details, summary
```

默认删除：

```text
script, iframe, form, input, video, audio, object, embed
```

必须删除所有事件属性，例如 `onclick`、`onerror`，并限制 URL 协议为 `https`。外部 `style/class/id` 不直接透传；小程序输出在 canonical HTML 上注入受控内联样式，不能用小程序白名单反向限制 Web。

### 5.2 小程序正文样式

服务端输出的小程序 HTML 应包含必要且安全的内联样式，避免完全依赖 `rich-text` 内部节点继承 WXSS：

- 正文：约 `30rpx`，行高 `1.8`，颜色 `#374151`。
- 段落：上下间距约 `20rpx` 至 `24rpx`。
- H2：`36rpx`、加粗、顶部留白 `40rpx`。
- H3：`32rpx`、加粗、顶部留白 `32rpx`。
- 图片：最大宽度 `100%`、高度自适应、圆角 `16rpx`、上下留白。
- 引用：浅蓝背景、左侧蓝色边框、适当内边距。
- 列表：保留缩进、编号和项目符号。
- 代码：浅灰背景、等宽字体、合理换行，避免横向撑破页面。
- 链接：蓝色并保留明显的可识别样式。

## 6. 小程序页面改造

### 6.1 第一阶段渲染方案

当前小程序没有 npm 包管理和第三方富文本组件体系，现有文章又主要由图片、加粗、链接和少量列表构成。因此第一阶段优先使用微信原生 `rich-text`：

```xml
<rich-text
  class="article-content"
  nodes="{{exp.contentHtml}}"
  user-select
/>
```

需要删除：

- `stripMarkdown()`。
- `contentLines` 页面状态。
- 普通 `<text>` 的正文循环渲染。

空正文判断改为检查 `exp.contentHtml`。如果服务端返回空字符串，显示统一的“暂无正文内容”占位。

### 6.2 后续增强方案

安全 HTTPS 链接从正文提取后，在原位置显示序号，并在正文底部渲染“相关链接”卡片。点击卡片通过 `wx.setClipboardData` 复制地址，避免依赖 `rich-text` 的链接事件和未配置的 `web-view` 域名。当前数据只有 3 条合法 HTTPS 正文链接；40 条 `javascript:void(0)` 历史伪链接在清洗时移除。

如果后续文章大量使用复杂表格、代码块，并明确需要原位置链接点击回调或更强的节点控制，再评估引入版本固定的 `mp-html` 本地组件。

引入第三方组件前需要确认：

- 许可证和版本维护策略。
- 小程序包体积影响。
- 与当前不使用 npm 构建的小程序工程是否兼容。
- 图片、链接、表格和代码块的实际收益是否足以覆盖维护成本。

不建议自行编写完整 Markdown 解析器，也不建议继续用正则表达式处理 Markdown。

### 6.3 页面信息层级

推荐的详情页结构为：

```text
自定义导航栏
封面图
标题
作者 · 机构 · 发布时间 · 阅读时间
标签
摘要卡片（可选）
富文本正文
点赞 / 分享操作栏
```

页面布局同时进行以下优化：

- 使用纵向 flex 管理导航、正文滚动区和操作栏，减少固定高度计算。
- 正文左右留白约 `32rpx`，使用白色正文背景。
- 底部操作栏保留安全区，正文增加对应底部间距。
- 加载状态使用骨架屏。
- 错误状态提供“重新加载”按钮。
- 支持正文文本选择复制。
- 分享、点赞逻辑保持不变。

## 7. 图片与外链处理

### 7.1 图片域名

确认以下域名已加入微信小程序合法图片或下载域名配置：

- `store.yinhangbang.com`
- `mmbiz.qpic.cn`

长期建议将 `mmbiz.qpic.cn` 图片迁移到项目自己的 R2 存储，并统一使用 `store.yinhangbang.com`，降低外链失效、防盗链和域名审核风险。

图片加载失败时应显示轻量占位，不能让正文结构完全塌陷。

### 7.2 封面处理

- 优先使用 `cover_asset_path` 作为详情页头图。
- 头图采用等比裁切或宽度撑满布局，并设置圆角。
- 如果正文首图与封面地址相同，只展示头图，不在正文重复展示。

### 7.3 外部链接

小程序不能假设所有网页链接都能直接打开。对于 `mp.weixin.qq.com` 等外链，应根据小程序业务域名配置确定行为：

1. 已配置且允许打开时，进入受控 `web-view` 页面。
2. 未配置时，提供复制链接操作或明确提示。
3. 禁止直接执行来源不明的 URL。

## 8. 实施顺序

### 阶段一：修复渲染链路

1. 抽取公共 Markdown 转换和 HTML 清洗模块。
2. 修正详情接口的内容来源优先级。
3. 新增 `contentHtml` 和 `relatedLinks`，保留旧字段兼容。
4. 小程序改用原生 `rich-text`，并增加相关链接复制卡片。
5. 删除 `stripMarkdown()` 和 `contentLines`。

### 阶段二：统一历史数据

1. dry-run 检查 38 篇历史 Markdown。
2. 将历史 Markdown 补入空的 `markdown_content`。
3. 批量重新生成 `content_html`。
4. 对比迁移前后标题、图片数量、链接数量和正文长度。
5. 对失败记录回滚并输出清单。

### 阶段三：体验增强

1. 展示封面、发布时间和阅读时间。
2. 完成图片域名配置和外部图片迁移。
3. 增加加载骨架、失败重试和图片占位。
4. 根据真实文章复杂度和原位置链接交互需求决定是否引入 `mp-html`。
5. 新版小程序稳定后再移除旧接口字段。

### 实施命令

```bash
# 内容转换单元测试
pnpm --filter @repo/trpc test:experience-content

# 数据迁移 dry-run（默认不写数据库）
pnpm --filter @repo/trpc migrate:experience-content

# 审核 dry-run 报告后才允许正式执行
pnpm --filter @repo/trpc migrate:experience-content -- --apply

# 对基线和候选环境各生成 50 个详情页截图
BASELINE_URL=https://baseline.example.com \
CANDIDATE_URL=https://candidate.example.com \
pnpm verify:experience-rendering
```

## 9. 验收与测试

### 9.1 数据兼容测试

- 11 篇新版 `markdown_content` 能正确显示。
- 38 篇历史 `metadata.markdown_source.content` 能正确显示。
- 1 篇纯 HTML 文章能正确显示。
- 空正文返回统一占位，不出现异常。

### 9.2 内容格式测试

- 加粗、斜体、删除线。
- 二级和三级标题。
- 有序、无序和嵌套列表。
- 引用、分割线、行内代码和代码块。
- 图片、图片失败占位、超宽图片。
- 普通链接和微信外部链接。
- 中文、英文、特殊字符和超长正文。

### 9.3 安全测试

- `script`、`iframe` 和表单节点被删除。
- `onclick`、`onerror` 等事件属性被删除。
- `javascript:` 和非允许协议链接被删除。
- 危险内联样式不能进入最终 HTML。
- 纯 HTML 历史文章同样经过清洗。

### 9.4 页面体验测试

- 正文不显示 Markdown 或 HTML 源码符号。
- 标题和封面不重复。
- 图片不超出屏幕宽度。
- 不同屏幕尺寸和底部安全区无遮挡。
- 长文滚动流畅，底部操作栏不覆盖正文。
- 点赞和分享行为不受影响。
- 加载失败后能够重新请求。

## 10. 完成标准

满足以下条件视为本次优化完成：

1. 小程序经验详情页不再使用 `stripMarkdown()`。
2. 所有 50 篇现有文章均可正常阅读。
3. 49 篇带 Markdown 来源的文章保持原有正文结构和图片。
4. 小程序不再显示 HTML 标签或 Markdown 语法符号。
5. 网页和小程序使用相同的服务端转换及清洗规则。
6. `markdown_content` 成为新增和编辑内容的唯一主源。
7. 图片宽度、安全区和长文滚动通过真机验证。
8. 旧版小程序在接口过渡期仍能正常工作。
