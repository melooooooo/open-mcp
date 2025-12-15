import { createClient } from '@supabase/supabase-js';
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

async function main() {
  console.log('Verifying scraped jobs...');

  const { data, error } = await supabase
    .from('scraped_jobs')
    .select('title, job_type, external_id')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  if (data.length === 0) {
    console.log('No jobs found!');
    return;
  }

  console.log(`Checking last ${data.length} jobs...`);
  console.table(data.map(job => ({
    ID: job.external_id,
    Type: job.job_type || 'NULL',
    Title: job.title.substring(0, 50)
  })));

  // Count stats
  const { count: typeCount, error: countError } = await supabase
    .from('scraped_jobs')
    .select('*', { count: 'exact', head: true })
    .not('job_type', 'is', null);

  console.log(`Total jobs with job_type: ${typeCount}`);
}

main();
