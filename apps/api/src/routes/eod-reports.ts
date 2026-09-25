import { and, desc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { eodReports } from "../db/schema.js";
import { requireSession } from "../lib/get-session.js";

const ReportBody = z.object({
  tickets: z.string(),
  devicesRefurbished: z.string(),
  packages: z.string(),
  calls: z.string(),
  other: z.string(),
});

const REPORT_COLUMNS = {
  id: eodReports.id,
  reportDate: eodReports.reportDate,
  tickets: eodReports.tickets,
  devicesRefurbished: eodReports.devicesRefurbished,
  packages: eodReports.packages,
  calls: eodReports.calls,
  other: eodReports.other,
};

export async function eodReportsRoute(app: FastifyInstance) {
  app.get("/api/eod-reports", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    return db
      .select(REPORT_COLUMNS)
      .from(eodReports)
      .where(eq(eodReports.userId, session.user.id))
      .orderBy(desc(eodReports.reportDate));
  });

  app.get<{ Params: { date: string } }>("/api/eod-reports/:date", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const [found] = await db
      .select(REPORT_COLUMNS)
      .from(eodReports)
      .where(and(eq(eodReports.userId, session.user.id), eq(eodReports.reportDate, request.params.date)));
    if (!found) return reply.status(404).send({ error: "no report filed for this date" });
    return found;
  });

  app.put<{ Params: { date: string } }>("/api/eod-reports/:date", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const parsed = ReportBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: "invalid body" });

    const [existing] = await db
      .select({ id: eodReports.id })
      .from(eodReports)
      .where(and(eq(eodReports.userId, session.user.id), eq(eodReports.reportDate, request.params.date)));

    const fields = { ...parsed.data, userEmail: session.user.email, updatedAt: new Date() };

    const [saved] = existing
      ? await db.update(eodReports).set(fields).where(eq(eodReports.id, existing.id)).returning(REPORT_COLUMNS)
      : await db
          .insert(eodReports)
          .values({ ...fields, userId: session.user.id, reportDate: request.params.date })
          .returning(REPORT_COLUMNS);
    return saved;
  });
}
