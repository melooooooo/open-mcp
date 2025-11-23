import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load envs
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

console.log('DATABASE_URL found:', !!DATABASE_URL);

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to database');
    console.log('Creating table scraped_jobs...');

    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "scraped_jobs" (
        "id" text PRIMARY KEY NOT NULL,
        "title" varchar(255) NOT NULL,
        "link" text NOT NULL,
        "content" text,
        "author" varchar(100),
        "reply_count" integer DEFAULT 0,
        "last_reply_date" varchar(50),
        "publish_date" varchar(50),
        "is_top" boolean DEFAULT false,
        "company_name" varchar(255),
        "job_type" varchar(50),
        "location" varchar(255),
        "salary" varchar(100),
        "source" varchar(50) DEFAULT 'byr_bbs',
        "external_id" varchar(100),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `);

    await client.query('CREATE INDEX IF NOT EXISTS "scraped_jobs_source_idx" ON "scraped_jobs" ("source");');
    await client.query('CREATE INDEX IF NOT EXISTS "scraped_jobs_external_id_idx" ON "scraped_jobs" ("external_id");');
    await client.query('CREATE INDEX IF NOT EXISTS "scraped_jobs_publish_date_idx" ON "scraped_jobs" ("publish_date");');

    // Enable RLS and policies
    await client.query('ALTER TABLE "scraped_jobs" ENABLE ROW LEVEL SECURITY;');

    // Try to create policies (ignore if exists)
    try {
      await client.query('CREATE POLICY "Public read access" ON "scraped_jobs" FOR SELECT USING (true);');
    } catch (e) {
      // Ignore error if policy already exists
      console.log('Policy "Public read access" might already exist');
    }

    try {
      await client.query('CREATE POLICY "Allow insert for all" ON "scraped_jobs" FOR INSERT WITH CHECK (true);');
    } catch (e) {
      console.log('Policy "Allow insert for all" might already exist');
    }

    console.log('Table scraped_jobs created/verified successfully!');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    await client.end();
  }
}

main();
