import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../db/client.js";
import { stageCommits } from "../db/schema.js";
import { findCaseBySlug, listCases } from "../lib/case-registry.js";
import { requireSession } from "../lib/get-session.js";

export async function casesRoute(app: FastifyInstance) {
  // Public metadata only — never world/stages/debrief (case-player-api spec).
  app.get("/cases", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    return listCases().map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      difficulty: c.difficulty,
      estimatedMinutes: c.estimatedMinutes,
      tags: c.tags,
    }));
  });

  // Opening + ordered stage ids only — no stage content (case-player-api spec).
  // `world` is included too: it's the instrument reading itself (what a
  // dashboard component needs to render), not "the answer" — only the
  // rubric is a protected secret (outline §11). Sending it upfront doesn't
  // spoil anything the gating on /stage/:id is meant to protect, since that
  // gating is about which stages/prompts are unlocked, not about hiding
  // the World's numbers from a trainee who's supposed to read them.
  app.get<{ Params: { slug: string } }>("/cases/:slug", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const found = findCaseBySlug(request.params.slug);
    if (!found) {
      reply.status(404).send({ error: "case not found" });
      return;
    }

    return {
      id: found.id,
      slug: found.slug,
      title: found.title,
      world: found.world,
      opening: found.opening,
      stageIds: found.stages.map((s) => s.id),
    };
  });

  // Gated on a commit existing for the immediately preceding stage — the
  // server-side half of "commit before reveal" (case-player-api spec).
  // Reveal/prompt only, never the rubric.
  app.get<{ Params: { slug: string; id: string }; Querystring: { attemptId?: string } }>(
    "/cases/:slug/stage/:id",
    async (request, reply) => {
      const session = await requireSession(request, reply);
      if (!session) return;

      const found = findCaseBySlug(request.params.slug);
      if (!found) {
        reply.status(404).send({ error: "case not found" });
        return;
      }

      const stageIndex = found.stages.findIndex((s) => s.id === request.params.id);
      if (stageIndex === -1) {
        reply.status(404).send({ error: "stage not found" });
        return;
      }

      if (stageIndex > 0) {
        const { attemptId } = request.query;
        if (!attemptId) {
          reply.status(400).send({ error: "attemptId is required to access a non-first stage" });
          return;
        }
        const priorStageId = found.stages[stageIndex - 1]!.id;
        const [priorCommit] = await db
          .select()
          .from(stageCommits)
          .where(and(eq(stageCommits.attemptId, attemptId), eq(stageCommits.stageId, priorStageId)));
        if (!priorCommit) {
          reply.status(403).send({ error: "prior stage not yet committed" });
          return;
        }
      }

      const stage = found.stages[stageIndex]!;
      return { id: stage.id, title: stage.title, reveal: stage.reveal, prompt: stage.prompt };
    },
  );
}
