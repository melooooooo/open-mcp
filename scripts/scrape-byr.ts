import { JSDOM } from 'jsdom';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const BASE_URL = 'https://bbs.byr.cn';
const BOARD_URL = `${BASE_URL}/board/JobInfo`;
const MAX_PAGES = 3;
const OUTPUT_FILE = path.resolve(__dirname, '../byr_jobs.xlsx');
const OUTPUT_JSON = path.resolve(__dirname, '../byr_jobs.json');
const CONCURRENT_REQUESTS = 5; // Number of concurrent requests for content fetching

interface JobThread {
  title: string;
  link: string;
  date: string;
  author: string;
  replyCount: number;
  lastReplyDate: string;
  isTop: boolean; // Sticky/Top posts
  content?: string; // The first post content
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
};

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const decoder = new TextDecoder('gbk');
  return decoder.decode(arrayBuffer);
}

async function fetchThreadContent(url: string): Promise<string> {
  try {
    const html = await fetchHtml(url);
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // The first post is usually the first .a-content or inside .a-body within the first article structure
    // Based on inspection, nForum structure often wraps posts in .a-wrap -> .a-body
    // The content is usually in .a-content p or just .a-content
    const firstPostContent = document.querySelector('.a-body .a-content');

    if (firstPostContent) {
      // Get text content
      let content = firstPostContent.textContent?.trim() || '';

      // Remove header metadata: "发信人: ... 站内"
      // The pattern usually ends with "站内" or a newline after the date/source line.
      // Example: "发信人: ... 发信站: 北邮人论坛 (Mon Nov 17 18:14:54 2025), 站内\nActual Content"

      const headerEndMarker = '站内';
      const headerIndex = content.indexOf(headerEndMarker);

      if (headerIndex !== -1) {
        content = content.substring(headerIndex + headerEndMarker.length).trim();
      } else {
        // Fallback: try to split by "发信站: 北邮人论坛" line if "站内" is missing
        // But usually "站内" is consistent. Let's try another marker just in case.
        const dateLineMarker = '发信站: 北邮人论坛';
        const dateLineIndex = content.indexOf(dateLineMarker);
        if (dateLineIndex !== -1) {
          // Find the end of this line
          const nextNewLine = content.indexOf('\n', dateLineIndex);
          if (nextNewLine !== -1) {
            content = content.substring(nextNewLine).trim();
          } else {
            // If no newline, maybe it's just the rest of the string?
            // But usually there's content after.
            // Let's check for the closing parenthesis of the date line
            const closingParen = content.indexOf(')', dateLineIndex);
            if (closingParen !== -1) {
              content = content.substring(closingParen + 1).trim();
              // Remove potential ", " or ", 站内" leftovers
              if (content.startsWith(',')) content = content.substring(1).trim();
              if (content.startsWith('站内')) content = content.substring(2).trim();
            }
          }
        }
      }

      // Remove footer: "--※ 来源:·北邮人论坛"
      const footerMarker = '--※ 来源:';
      const footerIndex = content.lastIndexOf(footerMarker);
      if (footerIndex !== -1) {
        content = content.substring(0, footerIndex).trim();
      }

      return content;
    }

    return '';
  } catch (error) {
    console.error(`Error fetching content for ${url}:`, error);
    return '';
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

      threads.push({
        title,
        link,
        date,
        author,
        replyCount,
        lastReplyDate,
        isTop
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
  const results: JobThread[] = [];
  let completed = 0;
  const total = threads.length;

  while (queue.length > 0 || processing.size > 0) {
    while (queue.length > 0 && processing.size < CONCURRENT_REQUESTS) {
      const thread = queue.shift()!;

      const promise = (async () => {
        console.log(`Fetching content for [${completed + 1}/${total}]: ${thread.title.substring(0, 20)}...`);
        thread.content = await fetchThreadContent(thread.link);
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
  let allThreads: JobThread[] = [];

  // 1. Fetch all lists first
  for (let i = 1; i <= MAX_PAGES; i++) {
    const threads = await fetchPage(i);
    console.log(`Page ${i} found ${threads.length} threads.`);
    allThreads = allThreads.concat(threads);

    if (i < MAX_PAGES) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`Total threads found: ${allThreads.length}. Starting content fetch...`);

  // 2. Fetch content for all threads
  // We process them in chunks or a queue to avoid overwhelming the server
  await processBatch(allThreads);

  console.log(`Successfully scraped ${allThreads.length} threads with content.`);

  // Save to JSON
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(allThreads, null, 2));
  console.log(`Saved to ${OUTPUT_JSON}`);

  // Save to XLSX
  if (allThreads.length > 0) {
    const worksheet = XLSX.utils.json_to_sheet(allThreads);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'JobInfo');
    XLSX.writeFile(workbook, OUTPUT_FILE);
    console.log(`Saved to ${OUTPUT_FILE}`);
  }
}

main();

