ALTER TABLE "user" ADD COLUMN "mini_program_activated_at" timestamp;
--> statement-breakpoint
UPDATE "user"
SET "mini_program_activated_at" = COALESCE("profile_completed_at", "created_at")
WHERE "id" IN (
  SELECT "user_id" FROM "account" WHERE "provider_id" = 'wechat_mini'
);
