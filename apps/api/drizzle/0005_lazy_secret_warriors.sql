CREATE TABLE "eod_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"user_email" text NOT NULL,
	"report_date" date NOT NULL,
	"tickets" text DEFAULT '' NOT NULL,
	"devices_refurbished" text DEFAULT '' NOT NULL,
	"packages" text DEFAULT '' NOT NULL,
	"calls" text DEFAULT '' NOT NULL,
	"other" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "eod_reports_user_date_idx" ON "eod_reports" USING btree ("user_id","report_date");