CREATE TYPE "public"."captured_message_channel" AS ENUM('email', 'sms');--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "captured_message" (
	"id" uuid PRIMARY KEY NOT NULL,
	"channel" "captured_message_channel" NOT NULL,
	"to_address" text NOT NULL,
	"subject" text,
	"body_text" text NOT NULL,
	"body_html" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "captured_message_to_address_created_at_idx" ON "captured_message" USING btree ("to_address","created_at" DESC NULLS LAST);