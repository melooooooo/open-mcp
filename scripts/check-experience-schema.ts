
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking finance_experiences table schema...');

  const { data, error } = await supabase
    .rpc('get_schema_info', { table_name: 'finance_experiences' }); // Attempting a nonexistent rpc or just a direct query if I could.

  // Actually, direct query to information_schema is better if I can't use RPC.
  // But usually we don't have direct SQL access unless via function. 
  // Let's try just selecting * from finance_experiences limit 1 and see keys data has.

  const { data: samples, error: sampleError } = await supabase
    .from('finance_experiences')
    .select('title, publish_time, created_at')
    .limit(10)
    .order('created_at', { ascending: false });

  if (sampleError) {
    console.error('Error fetching samples:', sampleError);
    return;
  }

  if (samples && samples.length > 0) {
    console.log('Top 10 articles (by created_at desc):');
    console.table(samples);
  } else {
    console.log('No data found in finance_experiences');
  }
}

checkSchema().catch(console.error);
