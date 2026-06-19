#!/usr/bin/env bash
#
# 内推数据同步：抓取北邮人论坛 JobInfo 版块 → 写入 Supabase scraped_jobs → 发送 Resend 邮件摘要；
# 同时抓取 Job / WorkLife 版块 → 写入独立的 byr_board_posts 表。
# 设计为服务器 crontab 一条命令调用，任一步失败即非零退出。
#
# 服务器配置示例（每天凌晨 6:00 执行，日志追加到文件）：
#   0 6 * * * cd /srv/open-mcp && bash scripts/sync-referrals.sh >> /var/log/referrals-sync.log 2>&1
#
# 依赖：
#   - 已执行 pnpm install（需要 node_modules/.bin/tsx、jsdom、@supabase/supabase-js）
#   - 根目录 .env 或 .env.local 配置 SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY
#   - 如需邮件摘要，配置 RESEND_ENABLED=true、RESEND_API_KEY、RESEND_FROM、RESEND_TO
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

echo "[$(date '+%F %T')] step 1/5: scraping byr JobInfo..."
"$TSX" scripts/scrape-byr-enhanced.ts

echo "[$(date '+%F %T')] step 2/5: uploading to scraped_jobs..."
"$TSX" scripts/upload-byr-enhanced.ts

echo "[$(date '+%F %T')] step 3/5: sending byr digest email..."
"$TSX" scripts/email-byr-digest.ts

echo "[$(date '+%F %T')] step 4/5: scraping byr Job and WorkLife boards..."
"$TSX" scripts/scrape-byr-boards.ts

echo "[$(date '+%F %T')] step 5/5: uploading to byr_board_posts..."
"$TSX" scripts/upload-byr-board-posts.ts

echo "[$(date '+%F %T')] referrals sync done"
