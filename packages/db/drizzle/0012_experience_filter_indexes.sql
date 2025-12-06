CREATE INDEX IF NOT EXISTS "finance_experiences_industry_idx" ON "finance_experiences" USING btree ("industry");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "finance_experiences_article_type_idx" ON "finance_experiences" USING btree ("article_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "finance_experiences_publish_time_idx" ON "finance_experiences" USING btree ("publish_time" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "finance_experiences_industry_publish_time_idx" ON "finance_experiences" USING btree ("industry", "publish_time" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "finance_experiences_tags_gin_idx" ON "finance_experiences" USING gin ("tags");
