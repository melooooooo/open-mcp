import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { scrapedJobs } from '../packages/db/job-schema';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY must be set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

const JSON_FILE_PATH = path.resolve(__dirname, '../byr_jobs_enhanced.json');

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

function getExternalId(link: string): string | null {
  const match = link.match(/\/article\/JobInfo\/(\d+)/);
  return (match && match[1]) ? match[1] : null;
}

async function main() {
  if (!fs.existsSync(JSON_FILE_PATH)) {
    console.error('Error: JSON file not found.');
    process.exit(1);
  }

  const rawData = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
  const jobs: JobItem[] = JSON.parse(rawData);

  console.log(`Found ${jobs.length} jobs to process.`);

  let successCount = 0;
  let failCount = 0;
  let updatedCount = 0;
  let skipCount = 0;

  for (const job of jobs) {
    const externalId = getExternalId(job.link);
    if (!externalId) continue;

    const jobData = {
      title: job.title,
      link: job.link,
      content: job.content || null,
      author: job.author,
      reply_count: job.replyCount,
      last_reply_date: job.lastReplyDate,
      publish_date: job.date,
      is_top: job.isTop,
      external_id: externalId,
      source: 'byr_bbs',
      job_type: job.jobType || null // Map the job type
    };

    // Check availability
    const { data: existing } = await supabase
      .from('scraped_jobs')
      .select('id, job_type')
      .eq('external_id', externalId)
      .single();

    if (existing) {
      // Update if job_type was missing but we have it now
      if (jobData.job_type && !existing.job_type) {
        const { error } = await supabase
          .from('scraped_jobs')
          .update({ job_type: jobData.job_type })
          .eq('id', existing.id);

        if (!error) {
          console.log(`Updated job type for: ${externalId}`);
          updatedCount++;
        } else {
          console.error(`Failed to update job ${externalId}:`, error);
        }
      } else {
        skipCount++;
      }
    } else {
      // Insert
      const { error } = await supabase
        .from('scraped_jobs')
        .insert(jobData);

      if (error) {
        console.error(`Failed to insert job ${externalId}:`, error);
        failCount++;
      } else {
        console.log(`Inserted job: ${externalId} [${jobData.job_type || 'Uncategorized'}]`);
        successCount++;
      }
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Total: ${jobs.length}`);
  console.log(`Inserted: ${successCount}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped: ${skipCount}`);
  console.log(`Failed: ${failCount}`);
}

main();
