import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalizeDate(dateStr: string | null): string | null {
  if (!dateStr) return null;

  let date = dateStr.trim();
  const match = date.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);

  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  return date;
}

async function main() {
  const id = '35468355-c3fc-4b6a-b373-54272dc2c242';
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
}

main();
