CREATE TABLE "attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"case_id" text NOT NULL,
	"case_version" integer NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"total_score" integer,
	"path_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "gotcha_progress" (
	"user_id" text NOT NULL,
	"gotcha_id" text NOT NULL,
	"first_seen_case_id" text NOT NULL,
	"seen_count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "gotcha_progress_user_id_gotcha_id_pk" PRIMARY KEY("user_id","gotcha_id")
);
--> statement-breakpoint
CREATE TABLE "stage_commits" (
	"id" text PRIMARY KEY NOT NULL,
	"attempt_id" text NOT NULL,
	"stage_id" text NOT NULL,
	"committed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"prompt_kind" text NOT NULL,
	"answer_json" jsonb NOT NULL,
	"score" integer NOT NULL,
	"feedback_shown" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gotcha_progress" ADD CONSTRAINT "gotcha_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_commits" ADD CONSTRAINT "stage_commits_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;