import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

async function main() {
  // Count by title
  const { count, error } = await supabase
    .from('scraped_jobs')
    .select('*', { count: 'exact', head: true })
    .ilike('title', '%内推%');

  if (error) {
    console.error('Error counting referrals by title:', error);
    return;
  }

  console.log(`Total posts with "内推" in title: ${count}`);
}

main();
