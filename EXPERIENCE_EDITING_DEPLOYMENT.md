# 经验分享编辑功能 - 部署指南

## 📋 功能概述

已成功实现经验分享内容的 Markdown 编辑功能，包括：
- ✅ 完整的 Markdown 编辑器（带工具栏和实时预览）
- ✅ 基于 tRPC 的 API 路由（权限控制）
- ✅ 独立的编辑页面（`/experiences/[slug]/edit`）
- ✅ 权限检查（管理员 + 作者）
- ✅ 数据库 Schema 更新
- ✅ 数据迁移脚本

---

## 🚀 部署步骤

### 1. 安装依赖

```bash
# 在项目根目录
pnpm install turndown
```

### 2. 生成并应用数据库迁移

```bash
# 进入 db 包目录
cd packages/db

# 生成迁移文件
pnpm db:generate

# 应用迁移到数据库
pnpm db:push
```

**新增字段**：
- `markdown_content` (text) - Markdown 内容
- `author_user_id` (text) - 作者用户 ID（外键到 user.id）
- `last_edited_by` (text) - 最后编辑者 ID
- `last_edited_at` (timestamp) - 最后编辑时间
- `updated_at` (timestamp) - 更新时间（自动更新）
- `metadata` (jsonb) - 元数据（已存在，现已映射）
- `content_html` (text) - HTML 内容（已存在，现已映射）

### 3. 运行数据迁移脚本（可选）

如果需要将现有内容迁移到 `markdown_content` 字段：

```bash
# 在项目根目录
tsx scripts/migrate-experience-markdown.ts
```

**迁移策略**：
1. 优先从 `metadata.markdown_source.content` 复制
2. 如果不存在，将 `content_html` 转换为 Markdown
3. 更新 `updated_at` 字段

### 4. 构建并启动应用

```bash
# 在项目根目录
pnpm build
pnpm dev  # 或 pnpm start
```

---

## 📁 文件清单

### 新增文件

1. **数据库 Schema**
   - `packages/db/job-schema.ts` - 更新了 `financeExperiences` 表定义

2. **迁移脚本**
   - `scripts/migrate-experience-markdown.ts` - 数据迁移脚本

3. **UI 组件**
   - `packages/ui/src/components/markdown/markdown-editor.tsx` - Markdown 编辑器组件

4. **tRPC 路由**
   - `packages/trpc/routers/web/experiences.ts` - 经验分享 API 路由
   - `packages/trpc/routers/_app.ts` - 注册新路由

5. **Web 页面**
   - `apps/web/src/app/(web)/experiences/[slug]/edit/page.tsx` - 编辑页面
   - `apps/web/src/components/career/experience-edit-button.tsx` - 编辑按钮组件

6. **修改文件**
   - `apps/web/src/app/(web)/experiences/[slug]/page.tsx` - 详情页（添加编辑按钮，优先渲染 markdown_content）

---

## 🔐 权限控制

### 编辑权限规则

- **管理员**：可以编辑所有经验分享
- **作者**：只能编辑自己创建的内容（通过 `author_user_id` 判断）
- **其他用户**：无编辑权限

### API 端点

```typescript
// 检查编辑权限
trpc.experiences.checkEditPermission.useQuery({ slug })

// 获取可编辑内容
trpc.experiences.getEditableContent.useQuery({ slug })

// 更新内容
trpc.experiences.updateContent.useMutation({
  experienceId,
  markdownContent
})
```

---

## 🎨 用户体验

### 编辑流程

1. 用户访问经验详情页 `/experiences/[slug]`
2. 如果有编辑权限，右上角显示"编辑"按钮
3. 点击进入编辑页面 `/experiences/[slug]/edit`
4. 使用 Markdown 编辑器编辑内容
   - 工具栏快速插入格式
   - 实时预览渲染效果
   - 支持快捷键（Ctrl/Cmd + S 保存，Ctrl/Cmd + Z 撤销）
5. 保存后自动跳转回详情页

### 编辑器特性

- ✅ 双栏布局：编辑 + 预览
- ✅ 工具栏：标题、粗体、斜体、代码、列表、链接、图片、表格等
- ✅ 撤销/重做功能
- ✅ 快捷键支持
- ✅ 自动保存提示
- ✅ 响应式设计

---

## 🔄 内容渲染优先级

详情页渲染逻辑：

```typescript
// 优先级：markdown_content > metadata.markdown_source.content > content_html
if (experience.markdown_content) {
  // 渲染 markdown_content
} else if (experience.metadata?.markdown_source?.content) {
  // 渲染 metadata.markdown_source.content
} else {
  // 渲染 content_html（sections）
}
```

---

## 🛡️ 安全措施

### HTML 清理

所有 Markdown 转换的 HTML 都会经过 `sanitize-html` 清理：

```typescript
// 允许的标签和属性
allowedTags: [..., "img", "h1", "h2", "h3", ...]
allowedAttributes: {
  img: ["src", "alt", "title", "width", "height"],
  a: ["href", "title", "target", "rel"],
  ...
}
```

### 权限检查

- 所有编辑相关 API 都使用 `protectedProcedure`
- 双重权限验证：角色 + 作者身份
- 前端和后端都进行权限检查

---

## 📊 数据库迁移状态

### 迁移前检查

```sql
-- 检查现有数据
SELECT 
  COUNT(*) as total,
  COUNT(metadata) as has_metadata,
  COUNT(content_html) as has_html
FROM finance_experiences;
```

### 迁移后验证

```sql
-- 验证迁移结果
SELECT 
  COUNT(*) as total,
  COUNT(markdown_content) as has_markdown,
  COUNT(author_user_id) as has_author
FROM finance_experiences;
```

---

## 🐛 故障排查

### 常见问题

1. **编辑按钮不显示**
   - 检查用户是否登录
   - 检查 `author_user_id` 是否正确设置
   - 检查用户角色是否为 admin

2. **保存失败**
   - 检查数据库连接
   - 检查 tRPC 路由是否正确注册
   - 查看浏览器控制台错误信息

3. **迁移脚本失败**
   - 确保已安装 `turndown` 依赖
   - 检查数据库连接配置
   - 查看脚本输出的错误信息

### 调试命令

```bash
# 检查 tRPC 路由
pnpm --filter web dev

# 查看数据库 Schema
cd packages/db
pnpm db:studio

# 运行类型检查
pnpm --filter @repo/trpc check-types
```

---

## 📝 后续优化建议

### 短期优化

1. **草稿功能**
   - 添加 `status` 字段（draft/published）
   - 支持保存草稿而不发布

2. **版本历史**
   - 创建 `experience_revisions` 表
   - 记录每次编辑的历史版本

3. **自动保存**
   - 实现定时自动保存草稿
   - 防止意外丢失编辑内容

### 长期优化

1. **协同编辑**
   - 实时协作编辑
   - 冲突检测和解决

2. **富文本编辑器**
   - 考虑使用 Tiptap 或 Lexical
   - 提供更好的编辑体验

3. **图片上传**
   - 集成图片上传功能
   - 支持拖拽上传

---

## ✅ 验收测试清单

- [ ] 数据库迁移成功执行
- [ ] 管理员可以看到所有内容的编辑按钮
- [ ] 作者可以看到自己内容的编辑按钮
- [ ] 其他用户看不到编辑按钮
- [ ] 编辑器工具栏功能正常
- [ ] 预览功能正常显示
- [ ] 保存功能正常工作
- [ ] 取消按钮正常返回
- [ ] 详情页优先显示 markdown_content
- [ ] HTML 内容正确清理和渲染

---

## 📞 技术支持

如有问题，请检查：
1. 浏览器控制台错误
2. 服务器日志
3. 数据库连接状态
4. tRPC 路由注册情况

---

**部署完成后，请运行完整的测试流程以确保功能正常！** 🎉
