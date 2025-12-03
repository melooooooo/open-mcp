import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from apps/web/.env
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Note: For DDL operations like CREATE EXTENSION/INDEX, we ideally need the service role key.
// But since I don't have it in the env file I can see (I only see NEXT_PUBLIC_...), 
// I will try with the anon key first. If it fails due to permissions, I'll have to ask the user 
// or try to find the service role key. 
// Wait, usually DDL requires admin privileges. The anon key definitely won't work for CREATE EXTENSION.
// However, I can try to use the `mcp1_execute_sql` tool if I had the project ID.
// But I don't have the project ID handy and I don't want to ask the user if I can avoid it.
// Actually, I can try to find the service role key in other env files or just try to run it.
// Let's look at `packages/db/index.ts` again to see how it connects. It uses `postgres` connection string.
// If I have `DATABASE_URL`, I can use `pg` client directly!
// Let's check `apps/web/.env` content first to see what I have.

// Actually, I'll just use the `pg` library to connect directly using DATABASE_URL.
// This is much more reliable for DDL than Supabase JS client with anon key.

import { Client } from 'pg';

async function optimizeSearch() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL is missing');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    console.log('Enabling pg_trgm extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

    console.log('Creating indexes...');

    // job_listings
    console.log('Indexing job_listings.company_name...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_job_listings_company_name_trgm ON job_listings USING gin (company_name gin_trgm_ops);');

    console.log('Indexing job_listings.job_title...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_job_listings_job_title_trgm ON job_listings USING gin (job_title gin_trgm_ops);');

    // finance_experiences
    console.log('Indexing finance_experiences.title...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_finance_experiences_title_trgm ON finance_experiences USING gin (title gin_trgm_ops);');

    console.log('Indexing finance_experiences.organization_name...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_finance_experiences_org_name_trgm ON finance_experiences USING gin (organization_name gin_trgm_ops);');

    // cp_job_sites (view on career_platform.job_sites)
    console.log('Indexing career_platform.job_sites.title...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_cp_job_sites_title_trgm ON career_platform.job_sites USING gin (title gin_trgm_ops);');

    console.log('Indexing career_platform.job_sites.company_name...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_cp_job_sites_company_name_trgm ON career_platform.job_sites USING gin (company_name gin_trgm_ops);');

    console.log('Optimization complete!');
  } catch (err) {
    console.error('Error optimizing search:', err);
  } finally {
    await client.end();
  }
}

optimizeSearch();
