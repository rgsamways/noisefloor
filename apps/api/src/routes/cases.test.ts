import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { user } from "../db/auth-schema.js";
import { db } from "../db/client.js";
import { entities, groupMemberships, groups } from "../db/permissions-schema.js";
import { createTestSession } from "../test-utils/auth.js";

// Reuses the existing seeded entity rather than inserting a new one —
// see eod-reports.test.ts's makeEodReportUser for why (getEodReportMode-
// style helpers elsewhere assume exactly one entity row exists; harmless
// here since cases/attempts routes don't touch that, but kept consistent).
async function grantAccessCaseScenarios(email: string) {
  const [testUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  const [entity] = await db.select({ id: entities.id }).from(entities).limit(1);
  const [group] = await db.insert(groups).values({ entityId: entity!.id, name: `Test Group ${crypto.randomUUID()}` }).returning();
  await db.insert(groupMemberships).values({ userId: testUser!.id, groupId: group!.id, rules: ["access_case_scenarios"] });
  return async () => {
    await db.delete(groups).where(eq(groups.id, group!.id));
  };
}

describe("GET /cases", () => {
  it("401s without a session", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/cases" });
    expect(response.statusCode).toBe(401);
  });

  it("403s a signed-in caller without access_case_scenarios", async () => {
    const app = buildApp();
    const { cookie, cleanup } = await createTestSession(app);
    try {
      const response = await app.inject({ method: "GET", url: "/cases", headers: { cookie } });
      expect(response.statusCode).toBe(403);
    } finally {
      await cleanup();
    }
  });

  it("returns only public metadata, never world/stages/debrief", async () => {
    const app = buildApp();
    const { cookie, email, cleanup } = await createTestSession(app);
    const groupCleanup = await grantAccessCaseScenarios(email);
    try {
      const response = await app.inject({ method: "GET", url: "/cases", headers: { cookie } });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveLength(1);
      expect(Object.keys(body[0]).sort()).toEqual(
        ["difficulty", "estimatedMinutes", "id", "slug", "tags", "title"].sort(),
      );
    } finally {
      await groupCleanup();
      await cleanup();
    }
  });
});

describe("GET /cases/:slug", () => {
  it("includes an ordered stage id list but no stage content", async () => {
    const app = buildApp();
    const { cookie, email, cleanup } = await createTestSession(app);
    const groupCleanup = await grantAccessCaseScenarios(email);
    try {
      const response = await app.inject({ method: "GET", url: "/cases/wet-leaves", headers: { cookie } });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.stageIds).toEqual(["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"]);
      expect(JSON.stringify(body)).not.toContain("rubric");
      expect(JSON.stringify(body)).not.toContain("reveal");
    } finally {
      await groupCleanup();
      await cleanup();
    }
  });

  it("404s for an unknown slug", async () => {
    const app = buildApp();
    const { cookie, email, cleanup } = await createTestSession(app);
    const groupCleanup = await grantAccessCaseScenarios(email);
    try {
      const response = await app.inject({ method: "GET", url: "/cases/no-such-case", headers: { cookie } });
      expect(response.statusCode).toBe(404);
    } finally {
      await groupCleanup();
      await cleanup();
    }
  });
});

describe("GET /cases/:slug/stage/:id", () => {
  it("serves the first stage without requiring an attemptId", async () => {
    const app = buildApp();
    const { cookie, email, cleanup } = await createTestSession(app);
    const groupCleanup = await grantAccessCaseScenarios(email);
    try {
      const response = await app.inject({ method: "GET", url: "/cases/wet-leaves/stage/s1", headers: { cookie } });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.reveal).toBeDefined();
      expect(body.prompt).toBeDefined();
      expect(JSON.stringify(body)).not.toContain("rubric");
    } finally {
      await groupCleanup();
      await cleanup();
    }
  });

  it("refuses a non-first stage without a prior commit", async () => {
    const app = buildApp();
    const { cookie, email, cleanup } = await createTestSession(app);
    const groupCleanup = await grantAccessCaseScenarios(email);
    try {
      const attemptResponse = await app.inject({
        method: "POST",
        url: "/attempts",
        headers: { cookie },
        payload: { caseSlug: "wet-leaves" },
      });
      const attemptId = attemptResponse.json().id;

      const response = await app.inject({
        method: "GET",
        url: `/cases/wet-leaves/stage/s2?attemptId=${attemptId}`,
        headers: { cookie },
      });
      expect(response.statusCode).toBe(403);
    } finally {
      await groupCleanup();
      await cleanup();
    }
  });

  it("serves a non-first stage once the prior one is committed", async () => {
    const app = buildApp();
    const { cookie, email, cleanup } = await createTestSession(app);
    const groupCleanup = await grantAccessCaseScenarios(email);
    try {
      const attemptResponse = await app.inject({
        method: "POST",
        url: "/attempts",
        headers: { cookie },
        payload: { caseSlug: "wet-leaves" },
      });
      const attemptId = attemptResponse.json().id;

      await app.inject({
        method: "POST",
        url: `/attempts/${attemptId}/commit`,
        headers: { cookie },
        payload: { stageId: "s1", answer: { optionId: "s1-capacity-capped" } },
      });

      const response = await app.inject({
        method: "GET",
        url: `/cases/wet-leaves/stage/s2?attemptId=${attemptId}`,
        headers: { cookie },
      });
      expect(response.statusCode).toBe(200);
    } finally {
      await groupCleanup();
      await cleanup();
    }
  });
});
