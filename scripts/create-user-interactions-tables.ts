import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load envs
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

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
    console.log('Creating user interactions tables...');

    // user_collections
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_collections" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "job_id" uuid NOT NULL REFERENCES "scraped_jobs"("id") ON DELETE CASCADE,
        "created_at" timestamp DEFAULT now() NOT NULL
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "user_collections_user_id_idx" ON "user_collections" ("user_id");');
    await client.query('CREATE INDEX IF NOT EXISTS "user_collections_job_id_idx" ON "user_collections" ("job_id");');
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS "user_collections_unique_idx" ON "user_collections" ("user_id", "job_id");');

    // user_likes
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_likes" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "job_id" uuid NOT NULL REFERENCES "scraped_jobs"("id") ON DELETE CASCADE,
        "created_at" timestamp DEFAULT now() NOT NULL
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "user_likes_user_id_idx" ON "user_likes" ("user_id");');
    await client.query('CREATE INDEX IF NOT EXISTS "user_likes_job_id_idx" ON "user_likes" ("job_id");');
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS "user_likes_unique_idx" ON "user_likes" ("user_id", "job_id");');

    // Enable RLS
    await client.query('ALTER TABLE "user_collections" ENABLE ROW LEVEL SECURITY;');
    await client.query('ALTER TABLE "user_likes" ENABLE ROW LEVEL SECURITY;');

    // Policies
    try {
      await client.query('CREATE POLICY "Allow all for now collection" ON "user_collections" FOR ALL USING (true);');
    } catch (e) { console.log('Policy might exist'); }

    try {
      await client.query('CREATE POLICY "Allow all for now like" ON "user_likes" FOR ALL USING (true);');
    } catch (e) { console.log('Policy might exist'); }

    console.log('Tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await client.end();
  }
}

main();
