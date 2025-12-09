CREATE TABLE "site_feedbacks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"user_name" varchar(255),
	"user_email" varchar(255),
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"attachment_url" text,
	"admin_remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "site_feedbacks_user_id_idx" ON "site_feedbacks" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "site_feedbacks_status_idx" ON "site_feedbacks" USING btree ("status");

