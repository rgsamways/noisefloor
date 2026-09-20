import {
  calculatePathScore,
  scoreFreeText,
  scoreHybrid,
  scoreOption,
  type HypothesisCommitRecord,
} from "@noisefloor/shared";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { attempts, stageCommits } from "../db/schema.js";
import { findCaseById, findCaseBySlug } from "../lib/case-registry.js";
import { requireSession } from "../lib/get-session.js";

const CreateAttemptBody = z.object({ caseSlug: z.string() });

const AnswerSchema = z.union([z.object({ optionId: z.string() }), z.object({ text: z.string() })]);
const CommitBody = z.object({ stageId: z.string(), answer: AnswerSchema });

// What's actually stored in stage_commits.answer_json — the raw answer plus,
// for a hypothesis-kind commit answered as free text, the matched bonus
// phrases needed later to compute the revision bonus without re-scoring.
type StoredAnswer = { optionId: string } | { text: string; matchedBonusPhrases?: string[] };

export async function attemptsRoute(app: FastifyInstance) {
  app.post("/attempts", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const parsed = CreateAttemptBody.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400).send({ error: "invalid body" });
      return;
    }

    const found = findCaseBySlug(parsed.data.caseSlug);
    if (!found) {
      reply.status(404).send({ error: "case not found" });
      return;
    }

    const [created] = await db
      .insert(attempts)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        caseId: found.id,
        caseVersion: found.version,
      })
      .returning();

    return { id: created!.id, caseId: created!.caseId, caseVersion: created!.caseVersion, startedAt: created!.startedAt };
  });

  app.post<{ Params: { id: string } }>("/attempts/:id/commit", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const parsed = CommitBody.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400).send({ error: "invalid body" });
      return;
    }
    const { stageId, answer } = parsed.data;

    const [attempt] = await db.select().from(attempts).where(eq(attempts.id, request.params.id));
    if (!attempt || attempt.userId !== session.user.id) {
      reply.status(404).send({ error: "attempt not found" });
      return;
    }

    const found = findCaseById(attempt.caseId);
    if (!found) {
      reply.status(404).send({ error: "case not found" });
      return;
    }

    const stageIndex = found.stages.findIndex((s) => s.id === stageId);
    if (stageIndex === -1) {
      reply.status(404).send({ error: "stage not found" });
      return;
    }
    const stage = found.stages[stageIndex]!;

    const existingCommits = await db.select().from(stageCommits).where(eq(stageCommits.attemptId, attempt.id));

    // Re-committing an already-committed stage is rejected — the first commit stands.
    if (existingCommits.some((c) => c.stageId === stageId)) {
      reply.status(409).send({ error: "stage already committed" });
      return;
    }

    // Mirrors the GET stage gate — a stage can't be committed before the one before it.
    if (stageIndex > 0) {
      const priorStageId = found.stages[stageIndex - 1]!.id;
      if (!existingCommits.some((c) => c.stageId === priorStageId)) {
        reply.status(403).send({ error: "prior stage not yet committed" });
        return;
      }
    }

    let score: number;
    let feedback: string;
    let storedAnswer: StoredAnswer;

    switch (stage.rubric.kind) {
      case "options": {
        if (!("optionId" in answer)) {
          reply.status(400).send({ error: "this stage requires an option answer" });
          return;
        }
        const result = scoreOption(stage.rubric.scores, answer.optionId);
        score = result.score;
        feedback = result.feedback;
        storedAnswer = { optionId: answer.optionId };
        break;
      }
      case "freeText": {
        if (!("text" in answer)) {
          reply.status(400).send({ error: "this stage requires a free-text answer" });
          return;
        }
        const result = scoreFreeText(stage.rubric.criteria, answer.text);
        score = result.score;
        feedback = result.feedback;
        storedAnswer = { text: answer.text, matchedBonusPhrases: result.matchedBonusPhrases };
        break;
      }
      case "hybrid": {
        const result = scoreHybrid(stage.rubric, answer);
        score = result.score;
        feedback = result.feedback;
        storedAnswer =
          "optionId" in answer
            ? { optionId: answer.optionId }
            : { text: answer.text, matchedBonusPhrases: (result as { matchedBonusPhrases: string[] }).matchedBonusPhrases };
        break;
      }
      case "findTheFault":
        reply.status(400).send({ error: "findTheFault stages aren't playable yet" });
        return;
      default:
        reply.status(500).send({ error: "unknown rubric kind" });
        return;
    }

    await db.insert(stageCommits).values({
      id: crypto.randomUUID(),
      attemptId: attempt.id,
      stageId,
      promptKind: stage.prompt.kind,
      answerJson: storedAnswer,
      score,
      feedbackShown: feedback,
    });

    const isFinalStage = stageIndex === found.stages.length - 1;
    if (!isFinalStage) {
      const nextStageId = found.stages[stageIndex + 1]!.id;
      return { score, feedback, nextStageId };
    }

    const allCommits = [...existingCommits, { stageId, promptKind: stage.prompt.kind, answerJson: storedAnswer, score }];
    const stageScores = allCommits.map((c) => c.score);
    const hypothesisCommits: HypothesisCommitRecord[] = allCommits
      .filter((c) => c.promptKind === "hypothesis")
      .map((c) => {
        const a = c.answerJson as StoredAnswer;
        return "optionId" in a
          ? { kind: "option" as const, optionId: a.optionId }
          : { kind: "freeText" as const, matchedBonusPhrases: a.matchedBonusPhrases ?? [] };
      });
    const totalScore = calculatePathScore(stageScores, hypothesisCommits);

    await db.update(attempts).set({ completedAt: new Date(), totalScore }).where(eq(attempts.id, attempt.id));

    return { score, feedback, debriefUnlocked: true, totalScore };
  });

  app.get<{ Params: { id: string } }>("/attempts/:id", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const [attempt] = await db.select().from(attempts).where(eq(attempts.id, request.params.id));
    if (!attempt || attempt.userId !== session.user.id) {
      reply.status(404).send({ error: "attempt not found" });
      return;
    }

    const commits = await db
      .select({ stageId: stageCommits.stageId, score: stageCommits.score, committedAt: stageCommits.committedAt })
      .from(stageCommits)
      .where(eq(stageCommits.attemptId, attempt.id));

    return {
      id: attempt.id,
      caseId: attempt.caseId,
      caseVersion: attempt.caseVersion,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      totalScore: attempt.totalScore,
      commits,
    };
  });
}
