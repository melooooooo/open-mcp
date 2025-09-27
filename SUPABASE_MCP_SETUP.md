# Supabase MCP 工具配置指南

## 📊 当前状态

### ✅ 已安装
- `mcp-server-supabase` 版本 0.5.3 已安装
- MCP 服务器配置文件已存在

### ❌ 未配置
- Supabase 连接参数未设置（URL、密钥为空）
- 因此 Supabase MCP 工具当前**无法使用**

## 🔧 配置步骤

### 1. 获取 Supabase 凭据

如果您想使用 Supabase MCP 工具，需要：

1. **创建 Supabase 项目**
   - 访问 [https://supabase.com](https://supabase.com)
   - 创建新项目或使用现有项目

2. **获取连接信息**
   - 进入项目设置 → API
   - 获取以下信息：
     - `Project URL` (例如: https://xxxx.supabase.co)
     - `anon public` 密钥
     - `service_role` 密钥（可选，用于管理操作）

### 2. 配置 Claude 设置

编辑 `~/.claude/settings.json` 文件：

```json
{
  "mcpServers": {
    "supabase": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js"],
      "env": {
        "SUPABASE_URL": "https://你的项目.supabase.co",
        "SUPABASE_ANON_KEY": "你的anon密钥",
        "SUPABASE_SERVICE_ROLE_KEY": "你的service_role密钥"
      }
    }
  }
}
```

### 3. 重启 Claude Code

配置完成后，需要重启 Claude Code 应用以加载新配置。

## 🔍 当前项目数据库方案

### 使用本地 PostgreSQL（推荐）

当前项目已配置为使用本地 PostgreSQL：

```bash
DATABASE_URL=postgresql://starter:starter@localhost:5432/starter
```

**优点**：
- ✅ 无需网络连接
- ✅ 开发速度快
- ✅ 数据完全本地
- ✅ 无使用限制

### 使用 Supabase 数据库（可选）

如果您想使用 Supabase 作为数据库：

1. **创建 Supabase 项目**
2. **获取数据库连接字符串**
   - 设置 → Database → Connection string
3. **更新 .env 文件**
   ```bash
   DATABASE_URL=postgresql://postgres.[项目ID]:[密码]@aws-0-[地区].pooler.supabase.com:5432/postgres
   ```

**优点**：
- ✅ 云端托管，无需本地安装
- ✅ 自动备份
- ✅ 内置认证系统
- ✅ 实时订阅功能

**注意**：
- 免费版有限制（500MB 存储，2GB 传输）
- 需要网络连接

## 📋 对比总结

| 特性 | 本地 PostgreSQL | Supabase 数据库 | Supabase MCP |
|-----|----------------|----------------|-------------|
| 用途 | 数据存储 | 数据存储 | API 操作工具 |
| 配置位置 | .env 文件 | .env 文件 | ~/.claude/settings.json |
| 依赖 | 本地 PostgreSQL | Supabase 账号 | Supabase 账号 + MCP 配置 |
| 当前状态 | ✅ 已配置 | ⚠️ 可选 | ❌ 未配置 |

## 💡 建议

### 开发阶段
- 使用**本地 PostgreSQL**（当前配置）
- 快速迭代，无网络依赖

### 生产部署
- 考虑使用 **Supabase** 或其他云数据库
- 自动扩展，高可用性

### MCP 工具
- 如果需要通过 Claude 直接操作 Supabase API，再配置 MCP
- 一般开发使用 Drizzle ORM 即可，无需 MCP 工具

## 🚀 下一步

### 继续使用本地数据库（推荐）
```bash
# 确保 PostgreSQL 运行中
brew services start postgresql

# 初始化数据库
cd packages/db
pnpm db:push

# 启动开发
cd ../..
pnpm dev
```

### 切换到 Supabase（可选）
1. 创建 Supabase 项目
2. 更新 .env 中的 DATABASE_URL
3. 运行 `pnpm db:push` 初始化表
4. 如需 MCP 工具，配置 ~/.claude/settings.json

---

*注：Supabase MCP 工具主要用于直接通过 Claude 操作 Supabase API，对于正常的 Web 开发，使用 Drizzle ORM 连接数据库即可，无需配置 MCP 工具。*