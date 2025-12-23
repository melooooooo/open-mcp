
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

const ARTICLES_TO_FIX = [
  '2024年年终奖发放情况大曝光_',
  '中信建投涨薪_',
  '网联清算待遇大曝光_'
];

async function main() {
  console.log(`Fixing titles for ${ARTICLES_TO_FIX.length} articles...`);

  for (const oldTitle of ARTICLES_TO_FIX) {
    if (!oldTitle.endsWith('_')) {
      console.log(`Skipping "${oldTitle}" (does not end with _)`);
      continue;
    }

    const newTitle = oldTitle.slice(0, -1);
    console.log(`Renaming "${oldTitle}" -> "${newTitle}"`);

    const { error } = await supabase
      .from('finance_experiences')
      .update({ title: newTitle })
      .eq('title', oldTitle);

    if (error) {
      console.error(`Failed to update "${oldTitle}":`, error);
    } else {
      console.log(`✅ Successfully updated to "${newTitle}"`);
    }
  }

  // Verification
  console.log('\nVerifying updates...');
  for (const oldTitle of ARTICLES_TO_FIX) {
    const newTitle = oldTitle.endsWith('_') ? oldTitle.slice(0, -1) : oldTitle;

    const { data } = await supabase
      .from('finance_experiences')
      .select('title')
      .eq('title', newTitle)
      .single();

    if (data) {
      console.log(`Confirmed existance: "${data.title}"`);
    } else {
      console.log(`❌ Could not find article with title "${newTitle}"`);
    }
  }
}

main().catch(console.error);
