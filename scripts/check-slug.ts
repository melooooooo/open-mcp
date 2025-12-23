
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('Checking article slugs...');

  const { data, error } = await supabase
    .from('finance_experiences')
    .select('title, slug')
    .ilike('title', '%网联清算%');

  if (error) {
    console.error('Error fetching data:', error);
  } else {
    data?.forEach(item => {
      console.log(`Title: "${item.title}"`);
      console.log(`Slug:  "${item.slug}"`);
      console.log(`Length: ${item.slug?.length}`);
    });
  }
}

main().catch(console.error);
