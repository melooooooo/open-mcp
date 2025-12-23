
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const targetDate = '2025/11/01';

  // Count jobs where source_updated_at is less than 2025-11-01
  const { count, error } = await supabase
    .from('job_listings')
    .select('*', { count: 'exact', head: true })
    .lt('source_updated_at', targetDate);

  if (error) {
    console.error('Error querying Supabase:', error);
    process.exit(1);
  }

  console.log(`Number of jobs published before ${targetDate}: ${count}`);

  const { data: earliestJob } = await supabase
    .from('job_listings')
    .select('source_updated_at')
    .order('source_updated_at', { ascending: true })
    .limit(1)
    .single();

  if (earliestJob) {
    console.log(`Earliest job date found: ${earliestJob.source_updated_at}`);
  } else {
    console.log('No jobs found in database.');
  }
}

main();
