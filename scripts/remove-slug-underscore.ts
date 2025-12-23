
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
  '网联清算待遇大曝光_' // Matches slug based on previous check
];

async function main() {
  console.log(`Fixing slugs for 3 articles...`);

  // We need to find them by their CURRENT slug (with underscore)
  for (const slugWithUnderscore of ARTICLES_TO_FIX) {
    if (!slugWithUnderscore.endsWith('_')) {
      console.log(`Skipping "${slugWithUnderscore}" (does not end with _)`);
      continue;
    }

    const newSlug = slugWithUnderscore.slice(0, -1);
    console.log(`Renaming Slug "${slugWithUnderscore}" -> "${newSlug}"`);

    const { error } = await supabase
      .from('finance_experiences')
      .update({ slug: newSlug })
      .eq('slug', slugWithUnderscore);

    if (error) {
      console.error(`Failed to update "${slugWithUnderscore}":`, error);
    } else {
      console.log(`✅ Successfully updated slug to "${newSlug}"`);
    }
  }

  // Verification
  console.log('\nVerifying updates...');
  for (const slugWithUnderscore of ARTICLES_TO_FIX) {
    const newSlug = slugWithUnderscore.slice(0, -1);

    const { data } = await supabase
      .from('finance_experiences')
      .select('title, slug')
      .eq('slug', newSlug)
      .single();

    if (data) {
      console.log(`Confirmed existence: Title="${data.title}", Slug="${data.slug}"`);
    } else {
      console.log(`❌ Could not find article with slug "${newSlug}"`);
    }
  }
}

main().catch(console.error);
