
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
  console.log('Searching for articles with "交通银行" in title...');

  const { data, error } = await supabase
    .from('finance_experiences')
    .select('title, author_name, author_user_id')
    .ilike('title', '%交通银行%');

  if (error) {
    console.error('Error fetching data:', error);
  } else {
    if (data && data.length > 0) {
      console.log(`Found ${data.length} article(s):`);
      data.forEach(item => {
        console.log('------------------------------------------------');
        console.log(`Title: ${item.title}`);
        console.log(`author_name: ${item.author_name}`);
        console.log(`author_user_id: ${item.author_user_id}`);
      });
    } else {
      console.log('No articles found matching "交通银行".');
    }
  }
}

main().catch(console.error);
