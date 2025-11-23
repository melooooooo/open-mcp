-- 1. Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the table
CREATE TABLE IF NOT EXISTS "scraped_jobs" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" text NOT NULL,
  "link" text NOT NULL,
  "content" text,
  "author" text,
  "reply_count" integer DEFAULT 0,
  "last_reply_date" text,
  "publish_date" text,
  "is_top" boolean DEFAULT false,
  "company_name" text,
  "job_type" text,
  "location" text,
  "salary" text,
  "source" text DEFAULT 'byr_bbs',
  "external_id" text,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS "scraped_jobs_source_idx" ON "scraped_jobs" ("source");
CREATE INDEX IF NOT EXISTS "scraped_jobs_external_id_idx" ON "scraped_jobs" ("external_id");
CREATE INDEX IF NOT EXISTS "scraped_jobs_publish_date_idx" ON "scraped_jobs" ("publish_date");

-- 4. Enable RLS (Row Level Security) - Optional but recommended
ALTER TABLE "scraped_jobs" ENABLE ROW LEVEL SECURITY;

-- 5. Create a policy to allow public read access (if needed)
CREATE POLICY "Public read access" ON "scraped_jobs"
  FOR SELECT USING (true);

-- 6. Create a policy to allow authenticated insert (or you can use service role to bypass)
-- For now, we might want to allow anon insert for the script if using anon key, 
-- BUT typically you should use Service Role Key for backend scripts. 
-- Since we are using Anon Key in the script, we need to allow Anon insert temporarily OR switch script to use Service Key.
-- Let's allow Insert for everyone for now to make the script work (be careful in production!)
CREATE POLICY "Allow insert for all" ON "scraped_jobs"
  FOR INSERT WITH CHECK (true);
