CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "byr_board_posts" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "board" varchar(50) NOT NULL,
  "board_name" varchar(100),
  "title" varchar(255) NOT NULL,
  "link" text NOT NULL,
  "content" text,
  "author" varchar(100),
  "reply_count" integer DEFAULT 0,
  "publish_date" varchar(50),
  "published_at" timestamp with time zone,
  "last_reply_date" varchar(50),
  "is_top" boolean DEFAULT false,
  "source" varchar(50) DEFAULT 'byr_bbs',
  "external_id" varchar(100) NOT NULL,
  "raw" jsonb,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "byr_board_posts_board_external_id_unique" UNIQUE ("board", "external_id")
);

CREATE INDEX IF NOT EXISTS "byr_board_posts_board_idx" ON "byr_board_posts" ("board");
CREATE INDEX IF NOT EXISTS "byr_board_posts_publish_date_idx" ON "byr_board_posts" ("publish_date");
CREATE INDEX IF NOT EXISTS "byr_board_posts_published_at_idx" ON "byr_board_posts" ("published_at");

ALTER TABLE "byr_board_posts" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Public read access" ON "byr_board_posts"
    FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow insert for all" ON "byr_board_posts"
    FOR INSERT WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Allow update for all" ON "byr_board_posts"
    FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
