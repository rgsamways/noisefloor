## Context

See proposal.md for motivation. Grounded in what's actually there today:

- `apps/api/src/db/permissions-schema.ts`'s `entities` table already models "the org" as a singleton row, resolved server-side via `admin.ts`'s own `resolveEntityId()` rather than ever taking an id from the client (`add-admin-panel`'s Decision 1: "a CRUD screen for a set of exactly one... is pure ceremony"). One site-wide toggle is exactly that same shape of thing.
- `apps/api/src/db/schema.ts`'s `eodReports` (from `add-eod-reports`) has five `text` columns — `tickets`, `devicesRefurbished`, `packages`, `calls`, `other` — and a `userEmail` column that's explicitly a write-time snapshot, not a live join, "so old reports stay attributable even after the account is gone or renamed."
- `apps/web/src/pages/Me.tsx`'s report form and `apps/web/src/pages/AdminUserReports.tsx`'s viewer both currently assume exactly one shape (five text fields) per report.
- This codebase already stores structured, variable-shaped, denormalized data in `jsonb` columns elsewhere (`attempts.pathJson`) rather than normalizing into child tables, when there's no cross-row querying need yet.

## Goals / Non-Goals

**Goals:**
- Let a siteAdmin switch end-of-day reports to an Excel-like structured shape, matching how Robin's team actually tracks this today.
- Never change how an already-filed report reads, regardless of what the site-wide setting is later switched to.
- Keep the freeform shape fully intact as a mode, not a deprecated path — Robin asked for a toggle, not a replacement.

**Non-Goals:**
- CSV export. Raised in the same conversation as a related idea but not yet greenlit for building — this change doesn't block it, but doesn't build it either.
- Migrating existing freeform reports into structured rows, or vice versa. Each report's mode is fixed at the moment it's saved (Decision 2).
- Per-user mode selection. This is a single site-wide setting, matching Robin's own framing ("siteAdmin setting"), not a per-technician preference.

## Decisions

**1. The mode setting lives on `entities`, not a new settings table.** There is exactly one entity today, already resolved server-side the same way this setting needs to be — building a dedicated `site_settings` table for a single flag would just be a second singleton-row pattern next to the one that already exists for this exact purpose.
*Alternative considered:* a new `site_settings` table. Rejected — no second setting is planned yet, and if one shows up later, adding a column to `entities` remains just as easy as it is now; there's nothing gained by generalizing today.

**2. A report's `mode` is stamped at save time and never changes afterward, independent of the site's current setting.** Reopening a report you filed last month, after a siteAdmin has since flipped the site to structured mode, must show it exactly as you filed it — freeform text, not an empty structured table pretending nothing was ever written. This mirrors `userEmail`'s own snapshot reasoning in the same table almost exactly: what's true *now* isn't what should govern how history reads. When editing a date with no existing report yet, the form uses the site's *current* setting, since there's no prior mode to preserve.
*Alternative considered:* always render the site's current mode, converting structured rows to a flattened text blob (or vice versa) on the fly for display. Rejected — lossy in one direction (structured → text loses per-row fields) and fabricative in the other (text → structured invents fields that were never filled in), for a display-only convenience that isn't needed.

**3. Structured data is stored as `jsonb` arrays on the existing `eod_reports` row, not normalized into per-category child tables.** A report is still fundamentally one row per user per day; the four structurable categories don't need independent querying or joining anywhere yet (that's what CSV export would need, and it's explicitly out of scope here). `attempts.pathJson` already establishes jsonb as this codebase's answer for "structured, variable-length, denormalized, no cross-row query need yet."
*Alternative considered:* four new child tables (`eod_report_tickets`, `..._devices`, `..._packages`, `..._calls`), each FK'd to `eod_reports.id`. Rejected as premature normalization — the only consumer of this data today is "render this one report's own rows," which a jsonb array serves directly with no join, and de-normalizing later (if CSV export or cross-report aggregation ever needs it) is a mechanical follow-up, not a redesign.

**4. The existing freeform text columns are untouched; four new nullable jsonb columns are added for the structured equivalents.** `tickets`/`devicesRefurbished`/`packages`/`calls` keep meaning exactly what they meant before for any report saved in freeform mode — including the DB/route field name `calls`, which stays as-is even though its displayed label changes to "Customer contacts" (Decision 4a below); renaming a column for a label-only change is unnecessary churn. New columns (`ticketRows`, `deviceRows`, `packageRows`, `contactRows`) hold the structured equivalents, populated only when `mode = 'structured'`. `other` has no structured counterpart at all — proposal.md's explicit call that it stays freeform regardless of mode, so there's exactly one column for it either way.

**4a. "Calls made to customers" is relabeled "Customer contacts" in both modes, and gains a `method` (Phone/Email) field plus the phone number or email address actually used.** Robin's own suggestion, generalizing a category that was arbitrarily narrowed to phone calls when plenty of real customer contact happens by email too. Applies to the freeform mode's *label* only (the underlying `calls` field/column name is unchanged, per Decision 4); the structured mode's `contactRows` shape is `{ customer, method: "phone" | "email", contact, reason, outcome }`, with `method` validated as a Zod enum at the API layer (it's inside a jsonb array, not a Postgres-level enum column).
*Alternative considered:* one column per category that holds either a string or a JSON array, distinguished only by the row's `mode`. Rejected — a column whose type depends on a sibling column is exactly the kind of implicit-shape data that's easy to deserialize wrong; two clearly-typed columns per category (used exclusively) costs a handful of nullable columns for real type safety.

**5. The PUT route determines which body shape to validate against by checking any *existing* row for that date first, falling back to the site's current setting only when creating a new one.** This is what actually implements Decision 2 — the server, not just the UI, is the source of truth for "which mode does this save belong to." A request that sends the wrong shape for an existing report's locked-in mode is a 400, not a silent reinterpretation.

**6. The Excel-like table UI is hand-rolled `<table>` markup with plain `<input>` cells, matching `Admin.tsx`'s own existing table markup rather than a spreadsheet component/library.** No spreadsheet or data-grid library exists anywhere in this repo, and four small per-category tables (a handful of columns, an "add row" button, a "remove row" button per row) don't justify introducing one — same reasoning already applied to `HudDatePicker` (hand-rolled to match the HUD look exactly) and to `admin-panel`'s own tables in the first place.

## Risks / Trade-offs

- **[Risk]** A report's mode being permanently locked at save time means a technician can't "upgrade" an old freeform report into structured rows later if a siteAdmin switches modes. → **Mitigation**: acceptable and intentional (Decision 2) — nothing stops them from filing today's report in whichever mode is currently active; only past history stays as filed, which is the whole point.
- **[Risk]** `jsonb` row arrays aren't queryable/aggregable the way normalized rows would be, if reporting needs ever grow (e.g. "how many devices refurbished this month across everyone"). → **Mitigation**: acceptable per Decision 3 — nothing today needs that, and normalizing later is additive, not a rewrite of what's built now.
- **[Risk]** Tests that mutate `entities.eodReportMode` (the one shared row) race against each other if split across files — vitest only serializes tests *within* a file by default, and running the full suite hit exactly this (a "structured save" test failing intermittently, caused by a concurrently-running settings test in a different file resetting the mode mid-flight). → **Mitigation**: every test touching this row lives in one file (`eod-reports.test.ts`, including the `/api/admin/settings` tests that would otherwise sit in `admin.test.ts`), which is enough to serialize them without slowing down the rest of the suite (confirmed: forcing `fileParallelism: false` project-wide fixed it too, but cost ~6x total runtime for a problem three tests caused — not worth it project-wide for this one shared row).

## Migration Plan

One new Drizzle migration: add `eod_report_mode` to `entities` (enum, default `freeform`) and the four new nullable jsonb columns plus a `mode` column to `eod_reports` (enum, not null, default `freeform` — every already-filed row is freeform, so this default is also the correct backfill value, not just a placeholder). Land order: migration + API routes first, then `/me` and the admin viewer, then the `/admin` toggle — same "backend then frontend" order every prior change in this repo has used.
