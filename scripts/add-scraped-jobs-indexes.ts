import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env') });

async function addScrapedJobsIndexes() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is missing');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database.');

    console.log('Creating indexes for scraped_jobs...');

    console.log('Indexing scraped_jobs.title...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_scraped_jobs_title_trgm ON scraped_jobs USING gin (title gin_trgm_ops);');

    console.log('Indexing scraped_jobs.company_name...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_scraped_jobs_company_name_trgm ON scraped_jobs USING gin (company_name gin_trgm_ops);');

    console.log('Indexes created successfully!');
  } catch (err) {
    console.error('Error creating indexes:', err);
  } finally {
    await client.end();
  }
}

addScrapedJobsIndexes();
