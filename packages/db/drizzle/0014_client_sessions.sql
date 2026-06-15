CREATE TABLE "client_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"client_type" varchar(64) NOT NULL,
	"device_id" text,
	"refresh_token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"last_used_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "client_session_refresh_token_hash_unique" UNIQUE("refresh_token_hash")
);
--> statement-breakpoint
ALTER TABLE "client_session" ADD CONSTRAINT "client_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "client_session_user_id_idx" ON "client_session" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "client_session_client_type_idx" ON "client_session" USING btree ("client_type");
