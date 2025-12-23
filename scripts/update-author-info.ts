
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

const TARGET_AUTHOR_NAME = '职场江湖指北';
const TARGET_AUTHOR_ID = 'FZIuy14OdmDxuBuPCm14PjilD5uLv5Kz';

const ARTICLES_TO_UPDATE = [
  '2024年年终奖发放情况大曝光_',
  '中信建投涨薪_',
  '网联清算待遇大曝光_'
];

async function main() {
  console.log(`Updating author info for ${ARTICLES_TO_UPDATE.length} articles...`);
  console.log(`Target Author Name: ${TARGET_AUTHOR_NAME}`);
  console.log(`Target Author ID: ${TARGET_AUTHOR_ID}`);

  for (const title of ARTICLES_TO_UPDATE) {
    const { error } = await supabase
      .from('finance_experiences')
      .update({
        author_name: TARGET_AUTHOR_NAME,
        author_user_id: TARGET_AUTHOR_ID
      })
      .eq('title', title);

    if (error) {
      console.error(`Failed to update "${title}":`, error);
    } else {
      console.log(`✅ Successfully updated "${title}"`);
    }
  }

  // Verification
  console.log('\nVerifying updates...');
  for (const title of ARTICLES_TO_UPDATE) {
    const { data } = await supabase
      .from('finance_experiences')
      .select('title, author_name, author_user_id')
      .eq('title', title)
      .single();

    if (data) {
      console.log(`[${data.title}] -> Author: ${data.author_name}, ID: ${data.author_user_id}`);
    }
  }
}

main().catch(console.error);
