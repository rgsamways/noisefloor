import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { createTestSession } from "../test-utils/auth.js";

async function startAttempt(app: ReturnType<typeof buildApp>, cookie: string) {
  const response = await app.inject({
    method: "POST",
    url: "/attempts",
    headers: { cookie },
    payload: { caseSlug: "wet-leaves" },
  });
  return response.json() as { id: string; caseId: string; caseVersion: number };
}

describe("POST /attempts", () => {
  it("records the case's current version at creation", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await createTestSession(app);
    try {
      const attempt = await startAttempt(app, cookie);
      expect(attempt.caseId).toBe("case-001");
      expect(attempt.caseVersion).toBe(1);
    } finally {
      await cleanup();
    }
  });
});

describe("POST /attempts/:id/commit", () => {
  it("returns a score, feedback, and the next stage id for a non-final commit", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await createTestSession(app);
    try {
      const attempt = await startAttempt(app, cookie);
      const response = await app.inject({
        method: "POST",
        url: `/attempts/${attempt.id}/commit`,
        headers: { cookie },
        payload: { stageId: "s1", answer: { optionId: "s1-capacity-capped" } },
      });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.score).toBe(2);
      expect(body.feedback).toBeTruthy();
      expect(body.nextStageId).toBe("s4");
    } finally {
      await cleanup();
    }
  });

  it("unlocks the debrief instead of a next stage on the final commit, with the revision bonus applied", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await createTestSession(app);
    try {
      const attempt = await startAttempt(app, cookie);
      await app.inject({
        method: "POST",
        url: `/attempts/${attempt.id}/commit`,
        headers: { cookie },
        payload: { stageId: "s1", answer: { optionId: "s1-capacity-capped" } },
      });
      await app.inject({
        method: "POST",
        url: `/attempts/${attempt.id}/commit`,
        headers: { cookie },
        payload: { stageId: "s4", answer: { optionId: "s4-foliage" } },
      });
      const response = await app.inject({
        method: "POST",
        url: `/attempts/${attempt.id}/commit`,
        headers: { cookie },
        payload: {
          stageId: "s5",
          answer: {
            text: "Nothing is broken — this is seasonal, caused by leaf growth. We're scheduling a survey to look at trimming.",
          },
        },
      });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.nextStageId).toBeUndefined();
      expect(body.debriefUnlocked).toBe(true);
      expect(body.debrief.narrative).toBeTruthy();
      // 2 (s1) + 3 (s4) + 2 (s5, "Covers the key points") + 1 revision bonus = 8
      expect(body.totalScore).toBe(8);
    } finally {
      await cleanup();
    }
  });

  it("rejects a second commit for a stage that's already committed", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await createTestSession(app);
    try {
      const attempt = await startAttempt(app, cookie);
      await app.inject({
        method: "POST",
        url: `/attempts/${attempt.id}/commit`,
        headers: { cookie },
        payload: { stageId: "s1", answer: { optionId: "s1-capacity-capped" } },
      });
      const response = await app.inject({
        method: "POST",
        url: `/attempts/${attempt.id}/commit`,
        headers: { cookie },
        payload: { stageId: "s1", answer: { optionId: "s1-radio-problem" } },
      });
      expect(response.statusCode).toBe(409);
    } finally {
      await cleanup();
    }
  });
});

describe("GET /attempts/:id", () => {
  it("reflects only committed stages", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await createTestSession(app);
    try {
      const attempt = await startAttempt(app, cookie);
      await app.inject({
        method: "POST",
        url: `/attempts/${attempt.id}/commit`,
        headers: { cookie },
        payload: { stageId: "s1", answer: { optionId: "s1-capacity-capped" } },
      });
      const response = await app.inject({ method: "GET", url: `/attempts/${attempt.id}`, headers: { cookie } });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.commits).toHaveLength(1);
      expect(body.commits[0].stageId).toBe("s1");
    } finally {
      await cleanup();
    }
  });
});
