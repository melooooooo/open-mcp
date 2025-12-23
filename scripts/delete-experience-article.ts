
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

async function deleteArticle() {
  const idToDelete = '4eb63e12-3f3c-4940-829c-c3a523fedfa8';
  console.log(`Attempting to delete article with ID: ${idToDelete}`);

  // First verify it exists
  const { data: check, error: checkError } = await supabase
    .from('finance_experiences')
    .select('title')
    .eq('id', idToDelete)
    .single();

  if (checkError || !check) {
    console.error('Article not found or error checking:', checkError);
    return;
  }

  console.log(`Confirming deletion of: "${check.title}"`);

  const { error: deleteError } = await supabase
    .from('finance_experiences')
    .delete()
    .eq('id', idToDelete);

  if (deleteError) {
    console.error('Error deleting article:', deleteError);
  } else {
    console.log('Successfully deleted article.');
  }
}

deleteArticle().catch(console.error);
