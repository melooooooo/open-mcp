#!/usr/bin/env bash
#
# 内推数据同步：抓取北邮人论坛 JobInfo 版块 → 写入 Supabase scraped_jobs。
# 设计为服务器 crontab 一条命令调用，依次执行「抓取」与「入库」，任一步失败即非零退出。
#
# 服务器配置示例（每天凌晨 6:00 执行，日志追加到文件）：
#   0 6 * * * cd /srv/open-mcp && bash scripts/sync-referrals.sh >> /var/log/referrals-sync.log 2>&1
#
# 依赖：
#   - 已执行 pnpm install（需要 node_modules/.bin/tsx、jsdom、@supabase/supabase-js）
#   - 根目录 .env 或 .env.local 配置 SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY
#
set -euo pipefail

# 切到仓库根目录（脚本位于 scripts/ 下）
cd "$(dirname "$0")/.."

TSX="node_modules/.bin/tsx"
if [ ! -x "$TSX" ]; then
  echo "Error: $TSX not found. Run 'pnpm install' first." >&2
  exit 1
fi

echo "[$(date '+%F %T')] referrals sync start"

echo "[$(date '+%F %T')] step 1/2: scraping byr JobInfo..."
"$TSX" scripts/scrape-byr-enhanced.ts

echo "[$(date '+%F %T')] step 2/2: uploading to scraped_jobs..."
"$TSX" scripts/upload-byr-enhanced.ts

echo "[$(date '+%F %T')] referrals sync done"
