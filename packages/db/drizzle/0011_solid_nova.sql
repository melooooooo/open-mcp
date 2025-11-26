CREATE TABLE "user_experience_likes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"experience_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_job_listing_collections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"job_listing_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_experience_likes" ADD CONSTRAINT "user_experience_likes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_experience_likes" ADD CONSTRAINT "user_experience_likes_experience_id_finance_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."finance_experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_job_listing_collections" ADD CONSTRAINT "user_job_listing_collections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_job_listing_collections" ADD CONSTRAINT "user_job_listing_collections_job_listing_id_job_listings_id_fk" FOREIGN KEY ("job_listing_id") REFERENCES "public"."job_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_experience_likes_user_id_idx" ON "user_experience_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_experience_likes_experience_id_idx" ON "user_experience_likes" USING btree ("experience_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_experience_likes_unique_idx" ON "user_experience_likes" USING btree ("user_id","experience_id");--> statement-breakpoint
CREATE INDEX "user_job_listing_collections_user_id_idx" ON "user_job_listing_collections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_job_listing_collections_job_id_idx" ON "user_job_listing_collections" USING btree ("job_listing_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_job_listing_collections_unique_idx" ON "user_job_listing_collections" USING btree ("user_id","job_listing_id");