import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

function normalizeDate(dateString) {
  if (!dateString) {
    return null;
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null; // Invalid date
    }
    // Format to YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Error normalizing date:", e);
    return null;
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const id = '1cb0cb1d-d01a-4f6b-902e-6f8bd72cb9a1';

  const { data, error } = await supabase
    .from('job_listings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  console.log('Record:', data);
  console.log('Original Date:', JSON.stringify(data.source_updated_at));
  console.log('Normalized Result:', JSON.stringify(normalizeDate(data.source_updated_at)));

  // Try to fix it
  if (normalizeDate(data.source_updated_at) !== data.source_updated_at) {
    console.log('Attempting fix...');
    await supabase.from('job_listings').update({ source_updated_at: normalizeDate(data.source_updated_at) }).eq('id', id);
    console.log('Fixed.');
  }
}

main();
