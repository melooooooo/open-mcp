
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
  const titles = [
    '2024年年终奖发放情况大曝光_',
    '中信建投涨薪_',
    '网联清算待遇大曝光_'
  ];

  console.log('Verifying imported articles...');

  for (const title of titles) {
    const { data, error } = await supabase
      .from('finance_experiences')
      .select('title, organization_name, created_at')
      .eq('title', title);

    if (error) {
      console.error(`Error checking ${title}:`, error);
    } else {
      if (data && data.length > 0) {
        console.log(`✅ Found: ${title}`, data[0]);
      } else {
        console.log(`❌ Not Found: ${title}`);
      }
    }
  }
}

main().catch(console.error);
