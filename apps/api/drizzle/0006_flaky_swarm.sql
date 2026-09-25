CREATE TYPE "public"."eod_report_mode" AS ENUM('freeform', 'structured');--> statement-breakpoint
ALTER TABLE "eod_reports" ADD COLUMN "mode" "eod_report_mode" DEFAULT 'freeform' NOT NULL;--> statement-breakpoint
ALTER TABLE "eod_reports" ADD COLUMN "ticket_rows" jsonb;--> statement-breakpoint
ALTER TABLE "eod_reports" ADD COLUMN "device_rows" jsonb;--> statement-breakpoint
ALTER TABLE "eod_reports" ADD COLUMN "package_rows" jsonb;--> statement-breakpoint
ALTER TABLE "eod_reports" ADD COLUMN "contact_rows" jsonb;--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN "eod_report_mode" "eod_report_mode" DEFAULT 'freeform' NOT NULL;