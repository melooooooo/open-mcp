# Scripts Documentation

## Logo Migration Scripts

这些脚本用于将职位站点的 favicon/logo 从外部链接迁移到 Cloudflare R2 存储。

### 快速开始

#### 一键执行完整迁移
```bash
./scripts/run-logo-migration.sh
```

这将自动执行以下步骤：
1. 从数据库查询所有职位站点数据
2. 下载 favicon 并上传到 R2
3. 更新数据库中的 company_logo 字段

### 单独执行步骤

#### 1. 准备数据
从数据库查询职位站点数据并保存到 `/tmp/all-logos.json`：
```bash
node scripts/prepare-logos-data.mjs
```

#### 2. 迁移到 R2
下载 favicon 并上传到 R2，结果保存到 `/tmp/r2-upload-results.json`：
```bash
node scripts/migrate-logos-to-r2.mjs
```

#### 3. 更新数据库
根据上传结果更新数据库中的 company_logo 字段：
```bash
node scripts/update-logos-in-db.mjs
```

### 处理失败项

#### 重试失败的站点
使用多个 favicon 源重试失败的站点：
```bash
node scripts/retry-failed-logos.mjs
```

#### 设置默认 Logo
为无法获取 favicon 的站点设置默认 logo：
```bash
node scripts/set-default-logos.mjs
```

### 其他脚本

#### 验证职位页面
使用 Playwright 验证职位页面是否正常显示：
```bash
node scripts/verify-jobs-page.mjs
```

#### 下载 Favicon
使用 Playwright 从网页中提取 favicon：
```bash
node scripts/download-favicon.mjs input.json output.json
```

#### 生成 SQL
从 InfoNav 数据生成插入 SQL：
```bash
node scripts/generate-infonav-sql.mjs
```

## 环境要求

### 依赖包
```bash
pnpm add -D pg -w
```

### 环境变量
需要在 `.env.local` 中配置以下变量：
```env
# Supabase/PostgreSQL
DATABASE_URL="postgresql://..."

# Cloudflare R2
R2_BUCKET_NAME="your-bucket-name"
R2_ACCOUNT_ID="your-account-id"
R2_PUBLIC_URL="https://your-public-url.com"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
```

## 工作原理

### Favicon 获取策略
脚本会按以下顺序尝试获取 favicon：
1. 当前数据库中的 logo URL
2. Google Favicons API (`https://www.google.com/s2/favicons?domain={hostname}&sz=128`)
3. DuckDuckGo Icons API (`https://icons.duckduckgo.com/ip2/{hostname}.ico`)
4. 网站根目录的 favicon.ico

### 上传到 R2
- 所有图片统一保存为 PNG 格式
- 存储路径：`logos/{job_site_id}.png`
- 公开访问 URL：`{R2_PUBLIC_URL}/logos/{job_site_id}.png`

### 数据库更新
- 更新 `career_platform.job_sites` 表的 `company_logo` 字段
- 同时更新 `updated_at` 字段为当前时间

## 故障排除

### 问题：无法连接数据库
**解决方案**：检查 `DATABASE_URL` 环境变量是否正确配置

### 问题：R2 上传失败
**解决方案**：
1. 检查 R2 相关环境变量是否正确
2. 确认 R2 bucket 存在且有写入权限
3. 检查网络连接

### 问题：某些站点 favicon 获取失败
**解决方案**：
1. 运行 `retry-failed-logos.mjs` 重试
2. 如果仍然失败，运行 `set-default-logos.mjs` 设置默认 logo
3. 或手动上传 logo 到 R2 并更新数据库

### 问题：HTTP 418 错误
**原因**：网站的反爬虫机制
**解决方案**：使用 `set-default-logos.mjs` 设置备用 logo

## 最佳实践

### 新增职位站点
添加新站点后，运行完整迁移流程：
```bash
./scripts/run-logo-migration.sh
```

### 定期维护
建议定期检查外部链接的可用性：
```sql
SELECT id, title, company_logo 
FROM career_platform.job_sites 
WHERE company_logo NOT LIKE '%store.yinhangbang.com%'
ORDER BY title;
```

### 批量更新
如需批量更新所有 logo，直接运行主脚本即可：
```bash
./scripts/run-logo-migration.sh
```

## 相关文档
- [Logo Migration Summary](./LOGO_MIGRATION_SUMMARY.md) - 迁移执行总结
- [Career Platform Supabase](../CAREER_PLATFORM_SUPABASE.md) - 数据库架构文档

