import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data, error } = await supabase
    .from('job_listings')
    .select('id, source_updated_at, company_name')
    .order('source_updated_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error(error);
    return;
  }

  console.log('Top 20 jobs by source_updated_at (desc):');
  console.log(JSON.stringify(data, null, 2));
}

main();
