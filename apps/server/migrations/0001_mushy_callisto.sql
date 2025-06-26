CREATE TABLE "crypto_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id_1" uuid NOT NULL,
	"user_id_2" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"session_state" text,
	"root_key" text,
	"sending_chain_key" text,
	"receiving_chain_key" text,
	"message_keys" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crypto_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "messages" RENAME COLUMN "content" TO "encrypted_content";--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "sender_key_id" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "recipient_key_id" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "message_number" varchar(255);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "previous_message_number" varchar(255);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "nonce" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "identity_key" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "signed_pre_key" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "one_time_pre_keys" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "registration_id" varchar(255);--> statement-breakpoint
ALTER TABLE "crypto_sessions" ADD CONSTRAINT "crypto_sessions_user_id_1_users_id_fk" FOREIGN KEY ("user_id_1") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crypto_sessions" ADD CONSTRAINT "crypto_sessions_user_id_2_users_id_fk" FOREIGN KEY ("user_id_2") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crypto_sessions" ADD CONSTRAINT "crypto_sessions_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crypto_sessions_user_room_idx" ON "crypto_sessions" USING btree ("user_id_1","user_id_2","room_id");