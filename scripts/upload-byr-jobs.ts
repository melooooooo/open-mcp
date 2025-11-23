import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
// Prioritize .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  // Fallback to standard loading order if explicit paths didn't work or weren't found
  dotenv.config();
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_KEY length:', SUPABASE_KEY.length);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY must be set in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false
  }
});

const JSON_FILE_PATH = path.resolve(__dirname, '../byr_jobs.json');

interface JobItem {
  title: string;
  link: string;
  date: string;
  author: string;
  replyCount: number;
  lastReplyDate: string;
  isTop: boolean;
  content?: string;
}

// Helper to extract external ID from link
// e.g. https://bbs.byr.cn/article/JobInfo/977558 -> 977558
function getExternalId(link: string): string | null {
  const match = link.match(/\/article\/JobInfo\/(\d+)/);
  return (match && match[1]) ? match[1] : null;
}

async function main() {
  console.log(`Reading jobs from: ${JSON_FILE_PATH}`);

  if (!fs.existsSync(JSON_FILE_PATH)) {
    console.error('Error: JSON file not found.');
    process.exit(1);
  }

  const rawData = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
  const jobs: JobItem[] = JSON.parse(rawData);

  console.log(`Found ${jobs.length} jobs to process.`);

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (const job of jobs) {
    const externalId = getExternalId(job.link);

    if (!externalId) {
      console.warn(`Skipping job with invalid link: ${job.link}`);
      continue;
    }

    // Check if exists
    const { data: existing } = await supabase
      .from('scraped_jobs')
      .select('id')
      .eq('external_id', externalId)
      .single();

    if (existing) {
      console.log(`Skipping existing job: ${externalId}`);
      skipCount++;
      continue;
    }

    // Insert new job
    // Note: We map the JSON fields to DB columns
    const { error } = await supabase
      .from('scraped_jobs')
      .insert({
        title: job.title,
        link: job.link,
        content: job.content || null,
        author: job.author,
        reply_count: job.replyCount,
        last_reply_date: job.lastReplyDate,
        publish_date: job.date,
        is_top: job.isTop,
        external_id: externalId,
        source: 'byr_bbs'
      });

    if (error) {
      console.error(`Failed to insert job ${externalId}:`, error);
      failCount++;
    } else {
      console.log(`Inserted job: ${externalId} - ${job.title.substring(0, 20)}...`);
      successCount++;
    }

    // Small delay to be nice to the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n--- Summary ---');
  console.log(`Total: ${jobs.length}`);
  console.log(`Inserted: ${successCount}`);
  console.log(`Skipped (Already Exists): ${skipCount}`);
  console.log(`Failed: ${failCount}`);
}

main();
