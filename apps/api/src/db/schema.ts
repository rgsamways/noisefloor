import { integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

// Users and attempts only — case content lives in packages/cases, not the
// DB (NOISEFLOOR-OUTLINE.md §10). `caseId`/`stageId`/`gotchaId` are plain
// text foreign "keys" into that content, not DB foreign keys, since the
// content package isn't a database table.

export const attempts = pgTable("attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  caseId: text("case_id").notNull(),
  // Recorded at creation so a later case revision doesn't retroactively
  // change what an in-progress or completed attempt was scored against.
  caseVersion: integer("case_version").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  totalScore: integer("total_score"),
  // Ordered list of hypothesis commits, kept denormalized here (in addition
  // to the stage_commits rows) so the revision-bonus strip in /me can be
  // rendered without re-deriving it from every commit row.
  pathJson: jsonb("path_json"),
});

export const stageCommits = pgTable("stage_commits", {
  id: text("id").primaryKey(),
  attemptId: text("attempt_id")
    .notNull()
    .references(() => attempts.id, { onDelete: "cascade" }),
  stageId: text("stage_id").notNull(),
  committedAt: timestamp("committed_at", { withTimezone: true }).notNull().defaultNow(),
  promptKind: text("prompt_kind").notNull(),
  answerJson: jsonb("answer_json").notNull(),
  score: integer("score").notNull(),
  feedbackShown: text("feedback_shown").notNull(),
});

export const gotchaProgress = pgTable(
  "gotcha_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    gotchaId: text("gotcha_id").notNull(),
    firstSeenCaseId: text("first_seen_case_id").notNull(),
    seenCount: integer("seen_count").notNull().default(1),
  },
  (table) => [primaryKey({ columns: [table.userId, table.gotchaId] })],
);
