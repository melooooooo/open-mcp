
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findArticle() {
  const titleToFind = '【校招】大唐电信校园招聘';
  console.log(`Searching for article with title: "${titleToFind}"`);

  const { data, error } = await supabase
    .from('finance_experiences')
    .select('id, title, created_at')
    .eq('title', titleToFind);

  if (error) {
    console.error('Error searching:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Found article(s):');
    console.table(data);
  } else {
    console.log('No article found with that exact title.');
    // Try fuzzy search if exact match fails
    console.log('Trying fuzzy search...');
    const { data: fuzzyData, error: fuzzyError } = await supabase
      .from('finance_experiences')
      .select('id, title, created_at')
      .ilike('title', '%大唐电信%');

    if (fuzzyError) {
      console.error('Error in fuzzy search:', fuzzyError);
    } else {
      console.table(fuzzyData);
    }
  }
}

findArticle().catch(console.error);
