import { JSDOM } from 'jsdom';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://bbs.byr.cn';
const BOARDS = [
  { board: 'Job', boardName: '毕业生找工作' },
  { board: 'WorkLife', boardName: '职场人生' },
] as const;
const MAX_PAGES = Number(process.env.BYR_BOARD_MAX_PAGES || 5);
const LOOKBACK_HOURS = Number(process.env.BYR_LOOKBACK_HOURS || 24);
const CONCURRENT_REQUESTS = 5;
const OUTPUT_FILE_JSON = path.resolve(__dirname, '../byr_board_posts.json');

interface ByrBoardPost {
  board: string;
  boardName: string;
  title: string;
  link: string;
  externalId: string;
  date: string;
  publishedAt?: string;
  author: string;
  replyCount: number;
  lastReplyDate: string;
  isTop: boolean;
  content?: string;
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

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
    return { start: parsed, end: parsed };
  }

  const fullDateMatch = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (fullDateMatch) {
    return getBeijingDayRange(
      Number(fullDateMatch[1]),
      Number(fullDateMatch[2]),
      Number(fullDateMatch[3])
    );
  }

  const monthDateMatch = date.match(/^(\d{1,2})-(\d{1,2})$/);
  if (monthDateMatch) {
    const { year } = getBeijingDateParts(now);
    return getBeijingDayRange(year, Number(monthDateMatch[1]), Number(monthDateMatch[2]));
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

function isPostInWindow(post: ByrBoardPost, windowStart: Date, now = new Date()) {
  if (post.publishedAt) {
    const publishedAt = new Date(post.publishedAt);
    return publishedAt >= windowStart && publishedAt <= now;
  }

  return isListDateInWindow(post.date, windowStart, now);
}

function getExternalId(link: string) {
  const match = link.match(/\/article\/[^/]+\/(\d+)/);
  return match?.[1] || '';
}

async function fetchHtml(url: string) {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return new TextDecoder('gbk').decode(arrayBuffer);
}

async function fetchPostContent(url: string): Promise<{ content: string; publishedAt?: string }> {
  try {
    const html = await fetchHtml(url);
    const dom = new JSDOM(html);
    const firstPostContent = dom.window.document.querySelector('.a-body .a-content');

    if (!firstPostContent) {
      return { content: '' };
    }

    let content = firstPostContent.textContent?.trim() || '';
    const publishedAt = parseArticlePublishedAt(content);

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
  } catch (error) {
    console.error(`Error fetching content for ${url}:`, error);
    return { content: '' };
  }
}

async function fetchBoardPage(board: string, boardName: string, page: number): Promise<ByrBoardPost[]> {
  const boardUrl = `${BASE_URL}/board/${board}`;
  const url = page === 1 ? boardUrl : `${boardUrl}?p=${page}`;
  console.log(`Fetching ${board} page ${page}: ${url}`);

  try {
    const html = await fetchHtml(url);
    const dom = new JSDOM(html);
    const rows = dom.window.document.querySelectorAll('.board-list tbody tr');
    const posts: ByrBoardPost[] = [];

    rows.forEach((row) => {
      const titleElement = row.querySelector('.title_9 a');
      if (!titleElement) return;

      const title = titleElement.textContent?.trim() || '';
      const href = titleElement.getAttribute('href') || '';
      const link = href.startsWith('/') ? `${BASE_URL}${href}` : href;
      const externalId = getExternalId(link);
      if (!externalId) return;

      const iconElement = row.querySelector('.title_8 samp');
      const dateElements = row.querySelectorAll('.title_10');

      posts.push({
        board,
        boardName,
        title,
        link,
        externalId,
        date: dateElements[0]?.textContent?.trim() || '',
        author: row.querySelector('.title_12 a')?.textContent?.trim() || '',
        replyCount: parseInt(row.querySelector('.title_11')?.textContent?.trim() || '0', 10),
        lastReplyDate: dateElements.length > 1 ? dateElements[1].textContent?.trim() || '' : '',
        isTop: iconElement?.className.includes('top') || false,
      });
    });

    return posts;
  } catch (error) {
    console.error(`Error fetching ${board} page ${page}:`, error);
    return [];
  }
}

async function processBatch(posts: ByrBoardPost[]) {
  const queue = [...posts];
  const processing = new Set<Promise<void>>();
  let completed = 0;
  const total = posts.length;

  while (queue.length > 0 || processing.size > 0) {
    while (queue.length > 0 && processing.size < CONCURRENT_REQUESTS) {
      const post = queue.shift()!;
      const promise = (async () => {
        const result = await fetchPostContent(post.link);
        post.content = result.content;
        post.publishedAt = result.publishedAt;
        if (result.publishedAt) {
          post.date = formatBeijingDateTime(new Date(result.publishedAt));
        }
        completed++;
        if (completed % 20 === 0 || completed === total) {
          console.log(`Fetched post contents: ${completed}/${total}`);
        }
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
  if (!Number.isFinite(MAX_PAGES) || MAX_PAGES <= 0) {
    throw new Error(`Invalid BYR_BOARD_MAX_PAGES: ${process.env.BYR_BOARD_MAX_PAGES}`);
  }
  if (!Number.isFinite(LOOKBACK_HOURS) || LOOKBACK_HOURS <= 0) {
    throw new Error(`Invalid BYR_LOOKBACK_HOURS: ${process.env.BYR_LOOKBACK_HOURS}`);
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000);
  let allPosts: ByrBoardPost[] = [];

  for (const { board, boardName } of BOARDS) {
    let boardPosts: ByrBoardPost[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const posts = await fetchBoardPage(board, boardName, page);
      console.log(`${board} page ${page} found ${posts.length} posts.`);
      boardPosts = boardPosts.concat(posts);

      if (page < MAX_PAGES) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const candidates = boardPosts.filter(post => isListDateInWindow(post.date, windowStart, now));
    console.log(`${board} list-date candidates: ${candidates.length}/${boardPosts.length}`);
    allPosts = allPosts.concat(candidates);
  }

  console.log(`Total board post candidates: ${allPosts.length}`);
  console.log('Starting content fetch...');
  await processBatch(allPosts);

  const filteredPosts = allPosts.filter(post => isPostInWindow(post, windowStart, now));
  console.log(`Precise date-filtered board posts: ${filteredPosts.length}/${allPosts.length}`);

  fs.writeFileSync(OUTPUT_FILE_JSON, JSON.stringify(filteredPosts, null, 2));
  console.log(`Saved to ${OUTPUT_FILE_JSON}`);
}

main().catch((error) => {
  console.error('Failed to scrape BYR boards:', error);
  process.exit(1);
});
