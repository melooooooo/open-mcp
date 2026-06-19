import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const JSON_FILE_PATH = path.resolve(__dirname, '../byr_jobs_enhanced.json');
const RESEND_API_URL = 'https://api.resend.com/emails';
const PREVIEW_LIMIT = 30;

interface JobItem {
  title: string;
  link: string;
  date: string;
  author: string;
  replyCount: number;
  lastReplyDate: string;
  isTop: boolean;
  content?: string;
  jobType?: string;
}

function isEnabled(value: string | undefined) {
  return ['1', 'true', 'yes', 'on'].includes((value || '').trim().toLowerCase());
}

function parseRecipients(value: string | undefined) {
  return (value || '')
    .split(/[,\s;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatShanghaiTime(date = new Date()) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function getExternalId(link: string) {
  return link.match(/\/article\/JobInfo\/(\d+)/)?.[1] || '';
}

function summarizeByType(jobs: JobItem[]) {
  const counts = new Map<string, number>();
  for (const job of jobs) {
    const key = job.jobType || '未分类';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function buildText(jobs: JobItem[], generatedAt: string) {
  const typeSummary = summarizeByType(jobs)
    .map(([type, count]) => `${type}: ${count}`)
    .join(' / ');
  const preview = jobs
    .slice(0, PREVIEW_LIMIT)
    .map((job, index) => {
      const tag = job.jobType ? ` [${job.jobType}]` : '';
      const top = job.isTop ? ' [置顶]' : '';
      return `${index + 1}. ${job.title}${tag}${top}
   作者: ${job.author || '-'} / 发布: ${job.date || '-'} / 回复: ${job.replyCount}
   ${job.link}`;
    })
    .join('\n\n');

  return `北邮人 JobInfo 同步完成
生成时间: ${generatedAt}
总数: ${jobs.length}
分类: ${typeSummary || '-'}

前 ${Math.min(PREVIEW_LIMIT, jobs.length)} 条:

${preview}

完整数据已随邮件附加为 byr_jobs_enhanced.json。`;
}

function buildHtml(jobs: JobItem[], generatedAt: string) {
  const typeSummary = summarizeByType(jobs)
    .map(([type, count]) => `<span class="pill">${escapeHtml(type)} ${count}</span>`)
    .join('');

  const rows = jobs.slice(0, PREVIEW_LIMIT).map((job, index) => {
    const title = escapeHtml(job.title);
    const link = escapeHtml(job.link);
    const externalId = escapeHtml(getExternalId(job.link));
    return `<tr>
      <td>${index + 1}</td>
      <td>
        <a href="${link}">${title}</a>
        <div class="meta">#${externalId || '-'}${job.isTop ? ' · 置顶' : ''}</div>
      </td>
      <td>${escapeHtml(job.jobType || '未分类')}</td>
      <td>${escapeHtml(job.author || '-')}</td>
      <td>${escapeHtml(job.date || '-')}</td>
      <td>${escapeHtml(job.replyCount)}</td>
    </tr>`;
  }).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 24px; background: #f6f7f9; color: #1f2933; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .wrap { max-width: 920px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .header { padding: 24px; border-bottom: 1px solid #e5e7eb; }
    h1 { margin: 0 0 8px; font-size: 22px; line-height: 1.3; }
    .muted { color: #64748b; font-size: 13px; }
    .stats { display: flex; gap: 12px; padding: 18px 24px; border-bottom: 1px solid #e5e7eb; }
    .stat { min-width: 120px; }
    .num { font-size: 28px; font-weight: 700; }
    .label { color: #64748b; font-size: 12px; }
    .types { padding: 0 24px 18px; border-bottom: 1px solid #e5e7eb; }
    .pill { display: inline-block; margin: 8px 8px 0 0; padding: 4px 10px; border-radius: 999px; background: #eef2f7; color: #334155; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #edf0f3; text-align: left; vertical-align: top; }
    th { color: #475569; background: #f8fafc; font-weight: 600; }
    a { color: #2563eb; text-decoration: none; }
    .meta { margin-top: 4px; color: #94a3b8; font-size: 12px; }
    .footer { padding: 16px 24px; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>北邮人 JobInfo 同步日报</h1>
      <div class="muted">生成时间：${escapeHtml(generatedAt)}（北京时间）</div>
    </div>
    <div class="stats">
      <div class="stat"><div class="num">${jobs.length}</div><div class="label">本次抓取帖子</div></div>
      <div class="stat"><div class="num">${jobs.filter((job) => job.jobType).length}</div><div class="label">已识别分类</div></div>
      <div class="stat"><div class="num">${jobs.filter((job) => job.isTop).length}</div><div class="label">置顶帖子</div></div>
    </div>
    <div class="types">${typeSummary || '<span class="pill">暂无分类</span>'}</div>
    <table>
      <thead>
        <tr><th>#</th><th>标题</th><th>类型</th><th>作者</th><th>发布</th><th>回复</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">完整抓取数据已作为 JSON 附件随邮件发送。</div>
  </div>
</body>
</html>`;
}

async function main() {
  if (!isEnabled(process.env.RESEND_ENABLED)) {
    console.log('RESEND_ENABLED is not true; skip BYR digest email.');
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const to = parseRecipients(process.env.RESEND_TO);
  const replyTo = process.env.RESEND_REPLY_TO?.trim();

  if (!apiKey || !from || to.length === 0) {
    console.error('Error: RESEND_API_KEY, RESEND_FROM and RESEND_TO must be set when RESEND_ENABLED=true.');
    process.exit(1);
  }

  if (!fs.existsSync(JSON_FILE_PATH)) {
    console.error(`Error: JSON file not found: ${JSON_FILE_PATH}`);
    process.exit(1);
  }

  const jsonContent = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
  const jobs: JobItem[] = JSON.parse(jsonContent);
  const generatedAt = formatShanghaiTime();
  const subject = `北邮人 JobInfo 同步日报 - ${jobs.length} 条 - ${generatedAt}`;

  const payload: Record<string, unknown> = {
    from,
    to,
    subject,
    html: buildHtml(jobs, generatedAt),
    text: buildText(jobs, generatedAt),
    attachments: [
      {
        filename: 'byr_jobs_enhanced.json',
        content: Buffer.from(jsonContent, 'utf-8').toString('base64'),
      },
    ],
  };

  if (replyTo) {
    payload.reply_to = replyTo;
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error) {
    const message = data?.error?.message || `HTTP ${response.status}`;
    console.error(`Resend digest email failed: ${message}`);
    process.exit(1);
  }

  console.log(`BYR digest email sent to ${to.join(', ')}. Message ID: ${data?.id || 'unknown'}`);
}

main().catch((error) => {
  console.error('Failed to send BYR digest email:', error);
  process.exit(1);
});
