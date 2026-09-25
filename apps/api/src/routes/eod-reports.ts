import { and, desc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { eodReports } from "../db/schema.js";
import { getEodReportMode } from "../lib/eod-report-mode.js";
import { requireSession } from "../lib/get-session.js";

const TicketRowSchema = z.object({ ticketNumber: z.string(), customer: z.string(), summary: z.string(), status: z.string() });
const DeviceRowSchema = z.object({ deviceType: z.string(), serialId: z.string(), notes: z.string() });
const PackageRowSchema = z.object({ direction: z.enum(["mailed", "accepted"]), description: z.string(), tracking: z.string() });
const ContactRowSchema = z.object({
  customer: z.string(),
  method: z.enum(["phone", "email"]),
  contact: z.string(),
  reason: z.string(),
  outcome: z.string(),
});

const FreeformReportBody = z.object({
  tickets: z.string(),
  devicesRefurbished: z.string(),
  packages: z.string(),
  calls: z.string(),
  other: z.string(),
});

const StructuredReportBody = z.object({
  ticketRows: z.array(TicketRowSchema),
  deviceRows: z.array(DeviceRowSchema),
  packageRows: z.array(PackageRowSchema),
  contactRows: z.array(ContactRowSchema),
  other: z.string(),
});

const REPORT_COLUMNS = {
  id: eodReports.id,
  reportDate: eodReports.reportDate,
  mode: eodReports.mode,
  tickets: eodReports.tickets,
  devicesRefurbished: eodReports.devicesRefurbished,
  packages: eodReports.packages,
  calls: eodReports.calls,
  other: eodReports.other,
  ticketRows: eodReports.ticketRows,
  deviceRows: eodReports.deviceRows,
  packageRows: eodReports.packageRows,
  contactRows: eodReports.contactRows,
};

export async function eodReportsRoute(app: FastifyInstance) {
  app.get("/api/eod-report-mode", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;
    return { mode: await getEodReportMode() };
  });

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

  // A report's mode is decided once, at the moment it's first saved, and
  // never changes on later edits — this route always saves in *the
  // existing row's own mode* if one exists for this date, falling back
  // to the site's current mode only when creating a brand-new report
  // (design.md's Decision 2). A body shaped for the wrong mode is
  // rejected, not silently reinterpreted.
  app.put<{ Params: { date: string } }>("/api/eod-reports/:date", async (request, reply) => {
    const session = await requireSession(request, reply);
    if (!session) return;

    const [existing] = await db
      .select({ id: eodReports.id, mode: eodReports.mode })
      .from(eodReports)
      .where(and(eq(eodReports.userId, session.user.id), eq(eodReports.reportDate, request.params.date)));

    const mode = existing?.mode ?? (await getEodReportMode());

    // Two full branches, not one generically-typed `fields` object — the
    // freeform and structured shapes genuinely differ, and Drizzle's
    // insert/update types want to know exactly which columns a given
    // call sets, not a loosely-typed superset of both.
    if (mode === "freeform") {
      const parsed = FreeformReportBody.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: "invalid body for freeform mode" });
      const fields = { ...parsed.data, userEmail: session.user.email, mode: "freeform" as const, updatedAt: new Date() };
      const [saved] = existing
        ? await db.update(eodReports).set(fields).where(eq(eodReports.id, existing.id)).returning(REPORT_COLUMNS)
        : await db
            .insert(eodReports)
            .values({ ...fields, userId: session.user.id, reportDate: request.params.date })
            .returning(REPORT_COLUMNS);
      return saved;
    }

    const parsed = StructuredReportBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: "invalid body for structured mode" });
    const fields = { ...parsed.data, userEmail: session.user.email, mode: "structured" as const, updatedAt: new Date() };
    const [saved] = existing
      ? await db.update(eodReports).set(fields).where(eq(eodReports.id, existing.id)).returning(REPORT_COLUMNS)
      : await db
          .insert(eodReports)
          .values({ ...fields, userId: session.user.id, reportDate: request.params.date })
          .returning(REPORT_COLUMNS);
    return saved;
  });
}
