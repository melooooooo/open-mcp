-- Drop FK from user_job_listing_collections.job_listing_id -> job_listings.id
-- 职位列表数据源切换到 feishu_job_listings 后，收藏记录的 job_listing_id
-- 不再保证存在于 job_listings 表中，因此移除外键约束。
-- user_id -> "user"(id) 的外键保留不变。
ALTER TABLE "public"."user_job_listing_collections" DROP CONSTRAINT IF EXISTS "user_job_listing_collections_job_listing_id_job_listings_id_fk";

-- feishu_job_listings 启用了 RLS 但无读策略，Supabase anon client 查不到数据。
-- 与 scraped_jobs 的 "Public read access" 策略保持一致，允许匿名读取。
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feishu_job_listings' AND policyname = 'Public read access') THEN
    CREATE POLICY "Public read access" ON "public"."feishu_job_listings" FOR SELECT USING (true);
  END IF;
END $$;
