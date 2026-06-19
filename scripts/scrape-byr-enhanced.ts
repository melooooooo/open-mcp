import { JSDOM } from 'jsdom';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const BASE_URL = 'https://bbs.byr.cn';
const BOARD_URL = `${BASE_URL}/board/JobInfo`;
const MAX_PAGES = 5; // Increased to 5 to get more data
const OUTPUT_FILE_JSON = path.resolve(__dirname, '../byr_jobs_enhanced.json');
const CONCURRENT_REQUESTS = 5;
const LOOKBACK_HOURS = Number(process.env.BYR_LOOKBACK_HOURS || 24);

interface JobThread {
  title: string;
  link: string;
  date: string;
  author: string;
  replyCount: number;
  lastReplyDate: string;
  isTop: boolean;
  content?: string;
  publishedAt?: string;
  jobType?: string; // New field
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
};

function detectJobType(title: string): string | undefined {
  const t = title.toLowerCase();

  if (t.includes('校招') || t.includes('campus') || t.includes('2025') || t.includes('2026') || t.includes('应届')) {
    return '校招';
  }
  if (t.includes('社招') || t.includes('social')) {
    return '社招';
  }
  if (t.includes('内推') || t.includes('referral')) {
    return '内推';
  }
  if (t.includes('实习') || t.includes('intern')) {
    return '实习';
  }

  return undefined;
}

function getBeijingDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find(part => part.type === type)?.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
  };
}

function formatBeijingDateTime(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find(part => part.type === type)?.value || '00';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

function createDateFromBeijingTime(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0
) {
  return new Date(Date.UTC(year, month - 1, day, hour - 8, minute, second, millisecond));
}

function getBeijingDayRange(year: number, month: number, day: number) {
  const start = createDateFromBeijingTime(year, month, day);
  const end = createDateFromBeijingTime(year, month, day, 23, 59, 59, 999);
  return { start, end };
}

function parseListDateRange(value: string, now = new Date()) {
  const date = value.trim();

  const timeMatch = date.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (timeMatch) {
    const { year, month, day } = getBeijingDateParts(now);
    const parsed = createDateFromBeijingTime(
      year,
      month,
      day,
      Number(timeMatch[1]),
      Number(timeMatch[2]),
      Number(timeMatch[3])
    );
    return { start: parsed, end: parsed, exact: true };
  }

  const fullDateMatch = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (fullDateMatch) {
    const range = getBeijingDayRange(
      Number(fullDateMatch[1]),
      Number(fullDateMatch[2]),
      Number(fullDateMatch[3])
    );
    return { ...range, exact: false };
  }

  const monthDateMatch = date.match(/^(\d{1,2})-(\d{1,2})$/);
  if (monthDateMatch) {
    const { year } = getBeijingDateParts(now);
    const range = getBeijingDayRange(year, Number(monthDateMatch[1]), Number(monthDateMatch[2]));
    return { ...range, exact: false };
  }

  return null;
}

function isListDateInWindow(date: string, windowStart: Date, now = new Date()) {
  const range = parseListDateRange(date, now);
  if (!range) return true;
  return range.end >= windowStart && range.start <= now;
}

const MONTHS: Record<string, number> = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

function parseArticlePublishedAt(rawContent: string) {
  const match = rawContent.match(/\(([A-Z][a-z]{2}) ([A-Z][a-z]{2})\s+(\d{1,2}) (\d{2}):(\d{2}):(\d{2}) (\d{4})\)/);
  if (!match) return undefined;

  const month = MONTHS[match[2]];
  if (!month) return undefined;

  return createDateFromBeijingTime(
    Number(match[7]),
    month,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6])
  );
}

function isThreadInWindow(thread: JobThread, windowStart: Date, now = new Date()) {
  if (thread.publishedAt) {
    const publishedAt = new Date(thread.publishedAt);
    return publishedAt >= windowStart && publishedAt <= now;
  }

  return isListDateInWindow(thread.date, windowStart, now);
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  // BYR BBS uses GBK encoding
  const decoder = new TextDecoder('gbk');
  return decoder.decode(arrayBuffer);
}

async function fetchThreadContent(url: string): Promise<{ content: string; publishedAt?: string }> {
  try {
    const html = await fetchHtml(url);
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // The first post is usually the first .a-content 
    const firstPostContent = document.querySelector('.a-body .a-content');

    if (firstPostContent) {
      let content = firstPostContent.textContent?.trim() || '';
      const publishedAt = parseArticlePublishedAt(content);

      // Cleanup logic (same as original script)
      const headerEndMarker = '站内';
      const headerIndex = content.indexOf(headerEndMarker);

      if (headerIndex !== -1) {
        content = content.substring(headerIndex + headerEndMarker.length).trim();
      } else {
        const dateLineMarker = '发信站: 北邮人论坛';
        const dateLineIndex = content.indexOf(dateLineMarker);
        if (dateLineIndex !== -1) {
          const nextNewLine = content.indexOf('\n', dateLineIndex);
          if (nextNewLine !== -1) {
            content = content.substring(nextNewLine).trim();
          } else {
            const closingParen = content.indexOf(')', dateLineIndex);
            if (closingParen !== -1) {
              content = content.substring(closingParen + 1).trim();
              if (content.startsWith(',')) content = content.substring(1).trim();
              if (content.startsWith('站内')) content = content.substring(2).trim();
            }
          }
        }
      }

      const footerMarker = '--※ 来源:';
      const footerIndex = content.lastIndexOf(footerMarker);
      if (footerIndex !== -1) {
        content = content.substring(0, footerIndex).trim();
      }

      return {
        content,
        publishedAt: publishedAt?.toISOString(),
      };
    }

    return { content: '' };
  } catch (error) {
    console.error(`Error fetching content for ${url}:`, error);
    return { content: '' };
  }
}

async function fetchPage(page: number): Promise<JobThread[]> {
  const url = page === 1 ? BOARD_URL : `${BOARD_URL}?p=${page}`;
  console.log(`Fetching page ${page}: ${url}`);

  try {
    const html = await fetchHtml(url);
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const rows = document.querySelectorAll('.board-list tbody tr');

    const threads: JobThread[] = [];

    rows.forEach((row) => {
      const titleElement = row.querySelector('.title_9 a');
      if (!titleElement) return;

      const title = titleElement.textContent?.trim() || '';
      const href = titleElement.getAttribute('href') || '';
      const link = href.startsWith('/') ? `${BASE_URL}${href}` : href;

      const iconElement = row.querySelector('.title_8 samp');
      const isTop = iconElement?.className.includes('top') || false;

      const dateElement = row.querySelector('.title_10');
      const date = dateElement?.textContent?.trim() || '';

      const authorElement = row.querySelector('.title_12 a');
      const author = authorElement?.textContent?.trim() || '';

      const replyCountElement = row.querySelector('.title_11');
      const replyCount = parseInt(replyCountElement?.textContent?.trim() || '0', 10);

      const dateElements = row.querySelectorAll('.title_10');
      const lastReplyDate = dateElements.length > 1 ? dateElements[1].textContent?.trim() || '' : '';

      // Determine job type
      const jobType = detectJobType(title);

      threads.push({
        title,
        link,
        date,
        author,
        replyCount,
        lastReplyDate,
        isTop,
        jobType
      });
    });

    return threads;

  } catch (error) {
    console.error(`Error fetching page ${page}:`, error);
    return [];
  }
}

async function processBatch(threads: JobThread[]) {
  const queue = [...threads];
  const processing = new Set<Promise<void>>();
  let completed = 0;
  const total = threads.length;

  while (queue.length > 0 || processing.size > 0) {
    while (queue.length > 0 && processing.size < CONCURRENT_REQUESTS) {
      const thread = queue.shift()!;

      const promise = (async () => {
        // console.log(`Fetching content for [${completed + 1}/${total}]: ${thread.title.substring(0, 20)}...`);
        const result = await fetchThreadContent(thread.link);
        thread.content = result.content;
        thread.publishedAt = result.publishedAt;
        if (result.publishedAt) {
          thread.date = formatBeijingDateTime(new Date(result.publishedAt));
        }
        completed++;
      })();

      processing.add(promise);
      promise.then(() => processing.delete(promise));
    }

    if (processing.size > 0) {
      await Promise.race(processing);
    }
  }
}

async function main() {
  if (!Number.isFinite(LOOKBACK_HOURS) || LOOKBACK_HOURS <= 0) {
    throw new Error(`Invalid BYR_LOOKBACK_HOURS: ${process.env.BYR_LOOKBACK_HOURS}`);
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000);
  let allThreads: JobThread[] = [];

  // 1. Fetch lists
  for (let i = 1; i <= MAX_PAGES; i++) {
    const threads = await fetchPage(i);
    console.log(`Page ${i} found ${threads.length} threads.`);
    allThreads = allThreads.concat(threads);

    if (i < MAX_PAGES) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`Total threads found: ${allThreads.length}. Filtering to posts from the last ${LOOKBACK_HOURS} hours...`);

  const coarseFilteredThreads = allThreads.filter(thread => isListDateInWindow(thread.date, windowStart, now));
  console.log(`List-date candidates: ${coarseFilteredThreads.length}/${allThreads.length}`);

  // Optional: Filter only those with detected job types? 
  // For now, let's keep all but maybe prioritize content fetching or logging
  const categorizedCount = coarseFilteredThreads.filter(t => t.jobType).length;
  console.log(`Categorized candidate threads: ${categorizedCount}/${coarseFilteredThreads.length}`);

  // 2. Fetch content
  console.log('Starting content fetch...');
  await processBatch(coarseFilteredThreads);

  const filteredThreads = coarseFilteredThreads.filter(thread => isThreadInWindow(thread, windowStart, now));
  console.log(`Precise date-filtered threads: ${filteredThreads.length}/${coarseFilteredThreads.length}`);

  console.log(`Successfully scraped ${filteredThreads.length} threads with content.`);

  // Save to JSON
  fs.writeFileSync(OUTPUT_FILE_JSON, JSON.stringify(filteredThreads, null, 2));
  console.log(`Saved to ${OUTPUT_FILE_JSON}`);
}

main();
