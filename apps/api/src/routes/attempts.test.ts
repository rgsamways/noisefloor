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
      expect(body.nextStageId).toBe("s2");
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
        payload: { stageId: "s2", answer: { optionId: "s2-check-history" } },
      });
      await app.inject({
        method: "POST",
        url: `/attempts/${attempt.id}/commit`,
        headers: { cookie },
        payload: { stageId: "s3", answer: { optionId: "s3-note-and-monitor" } },
      });
      await app.inject({
        method: "POST",
        url: `/attempts/${attempt.id}/commit`,
        headers: { cookie },
        payload: { stageId: "s4", answer: { optionId: "s4-foliage" } },
      });
      await app.inject({
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
      await app.inject({
        method: "POST",
        url: `/attempts/${attempt.id}/commit`,
        headers: { cookie },
        payload: { stageId: "s6", answer: { optionId: "s6-shaper-misconfigured" } },
      });
      await app.inject({
        method: "POST",
        url: `/attempts/${attempt.id}/commit`,
        headers: { cookie },
        payload: { stageId: "s7", answer: { text: "The only real change was the shaper edit at 11:52 — ping doesn't reflect throughput." } },
      });
      await app.inject({
        method: "POST",
        url: `/attempts/${attempt.id}/commit`,
        headers: { cookie },
        payload: { stageId: "s8", answer: { optionId: "s8-management-chatter" } },
      });
      await app.inject({
        method: "POST",
        url: `/attempts/${attempt.id}/commit`,
        headers: { cookie },
        payload: { stageId: "s9", answer: { optionId: "s9-restore-backup" } },
      });
      const response = await app.inject({
        method: "POST",
        url: `/attempts/${attempt.id}/commit`,
        headers: { cookie },
        payload: {
          stageId: "s10",
          answer: { text: "Root cause was a shaper edit (kbit/s, not Mbps); restored from backup." },
        },
      });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.nextStageId).toBeUndefined();
      expect(body.debriefUnlocked).toBe(true);
      expect(body.debrief.narrative).toBeTruthy();
      // 2(s1) + 3(s2) + 3(s3) + 3(s4) + 2(s5) + 3(s6) + 3(s7) + 3(s8) + 3(s9) + 3(s10) = 28
      // + 1 revision bonus (s1 -> s4 hypothesis commits differ) = 29
      expect(body.totalScore).toBe(29);
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
