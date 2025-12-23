
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { pgTable, text, varchar } from "drizzle-orm/pg-core";

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
  console.log('Querying for admin users...');

  const { data, error } = await supabase
    .from('user')
    .select('id, name, email, role')
    .eq('role', 'admin');

  if (error) {
    console.error('Error fetching admins:', error);
  } else {
    if (data && data.length > 0) {
      console.log(`Found ${data.length} admin(s):`);
      data.forEach(user => {
        console.log(`- Name: ${user.name}, Email: ${user.email}, ID: ${user.id}`);
      });
    } else {
      console.log('No admin users found.');
    }
  }
}

main().catch(console.error);
