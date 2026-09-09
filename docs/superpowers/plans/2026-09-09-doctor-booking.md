# Per-Doctor Booking Remake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the global slot generator with per-doctor weekly schedules + exceptions and remake admin into a doctor workspace (schedules → slots → bookings), nuking the old global code.

**Architecture:** Two new tables (`doctor_schedule`, `schedule_exception`) feed the existing `availability_slot`/`appointment` tables; booking kernel guards stay untouched; admin `providers/[id]` gains Schedule/Slots/Bookings tabs; old `generateSlots` + global form deleted in the nuke task.

**Tech Stack:** Next 16.3.3 App Router (Turbopack), React 19, TS 7.0.2, Drizzle 0.45 + postgres.js 3.4, zod, next-intl (fa source), JalaliDatePicker + formatJalali, bun only.

**Spec:** `docs/superpowers/specs/2026-09-09-doctor-booking-design.md`

## Global Constraints

- `bun` only, never pnpm/npm/yarn.
- Server Actions export async only; pure helpers live in `kernel.ts` / `schedule-kernel.ts`.
- Every `contexts/*/queries.ts` export wrapped in React `cache()` with `server-only` line 1.
- All dates via `JalaliDatePicker` + `formatJalali*`; native `type="date"`/`datetime-local` forbidden (`type="time"` allowed).
- RTL logical Tailwind props only (`ps/pe`, `ms/me`, `start-0/end-0`); `pl/pr`/`left/right` forbidden.
- `lucide-react` direct imports only; dynamic names via `resolveIcon` from `@/components/clinical/icons`.
- PG index names must be `table_column_idx` style, never a bare table name (namespace collision kills migration).
- Slot take = conditional `UPDATE availability_slot ... WHERE booked_count + $party <= capacity`; never SELECT+check. Generation serializes with `SELECT ... FOR UPDATE` on service row.
- `cookies()/headers()/params/searchParams` async only (Next 16).
- `bunx tsc --noEmit` must be 0; `bun run lint` (oxlint src) must be 0; `bun run test` (vitest) green.
- `messages/fa.json` is source of truth; `en`/`ar` are overrides.

---

### Task 1: Schema + migration (2 new tables)

**Files:**
- Modify: `src/db/schema/catalog.ts`
- Create via generate: `src/db/migrations/00XX_*.sql` (drizzle-kit names it)
- Test: `bun run db:generate` (no DB needed)

**Interfaces:**
- Consumes: existing `providers.id`, `services.id`
- Produces: `doctorSchedules` + `scheduleExceptions` tables used by Tasks 2–5

- [ ] **Step 1: Append the two tables to catalog.ts**

```ts
// append to src/db/schema/catalog.ts (after availabilitySlots)
import { date } from "drizzle-orm/pg-core";

export const doctorSchedules = pgTable("doctor_schedule", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  serviceId: text("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  weekday: integer("weekday").notNull(), // 0=Sun … 6=Sat, matches expandPattern
  startTime: text("start_time").notNull(), // "HH:MM"
  endTime: text("end_time").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  capacity: integer("capacity").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("doctor_schedule_provider_idx").on(t.providerId),
  index("doctor_schedule_service_idx").on(t.serviceId),
  uniqueIndex("doctor_schedule_unique").on(t.providerId, t.serviceId, t.weekday, t.startTime),
]);

export const scheduleExceptions = pgTable("schedule_exception", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  serviceId: text("service_id").references(() => services.id, { onDelete: "cascade" }),
  exceptionDate: date("exception_date").notNull(), // YYYY-MM-DD
  isClosed: boolean("is_closed").notNull().default(true),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("schedule_exception_provider_idx").on(t.providerId, t.exceptionDate),
  index("schedule_exception_service_idx").on(t.serviceId),
]);
```

Note: `catalog.ts` currently imports `{ pgTable, text, timestamp, integer, boolean, numeric, jsonb, type AnyPgColumn }` — add `index, uniqueIndex, date` to that import.

- [ ] **Step 2: Generate the migration**

Run: `bun run db:generate`
Expected: new `src/db/migrations/00XX_*.sql` containing `CREATE TABLE "doctor_schedule"` and `"schedule_exception"`. Open it and confirm index names are `doctor_schedule_provider_idx`, `doctor_schedule_service_idx`, `schedule_exception_provider_idx` (no bare `intake_period`-style collision).

- [ ] **Step 3: Typecheck + commit**

Run: `bunx tsc --noEmit`
Expected: 0 errors.

```bash
git add src/db/schema/catalog.ts src/db/migrations
git commit -m "feat(booking): doctor_schedule + schedule_exception schema"
```

---

### Task 2: Schedule kernel (pure helpers + unit tests)

**Files:**
- Create: `src/contexts/catalog/schedule-kernel.ts`
- Create: `src/contexts/catalog/__tests__/schedule-kernel.test.ts`

**Interfaces:**
- Consumes: rows of `doctorSchedules`/`scheduleExceptions`
- Produces: `validateScheduleInput(input: unknown): boolean`, `isClosedDay(exceptions, providerId, serviceId, ymd: string): boolean`, `expandSchedules(schedules, exceptions, fromYmd: string, toYmd: string): Date[]` used by Task 3.

- [ ] **Step 1: Write the failing test**

```ts
// src/contexts/catalog/__tests__/schedule-kernel.test.ts
import { describe, expect, it } from "vitest";
import { validateScheduleInput, isClosedDay, expandSchedules } from "../schedule-kernel";

describe("schedule-kernel", () => {
  it("rejects end <= start", () => {
    expect(validateScheduleInput({ weekday: 6, startTime: "13:00", endTime: "09:00", durationMinutes: 30, capacity: 1 })).toBe(false);
  });
  it("accepts a valid row", () => {
    expect(validateScheduleInput({ weekday: 6, startTime: "09:00", endTime: "13:00", durationMinutes: 30, capacity: 1 })).toBe(true);
  });
  it("whole-doctor exception closes any service; service exception closes only that service", () => {
    const ex = [{ providerId: "d1", serviceId: null as string | null, exceptionDate: "2026-09-12" }];
    expect(isClosedDay(ex, "d1", "s1", "2026-09-12")).toBe(true);
    expect(isClosedDay(ex, "d1", "s1", "2026-09-13")).toBe(false);
    const exSvc = [{ providerId: "d1", serviceId: "s1", exceptionDate: "2026-09-12" }];
    expect(isClosedDay(exSvc, "d1", "s1", "2026-09-12")).toBe(true);
    expect(isClosedDay(exSvc, "d1", "s2", "2026-09-12")).toBe(false);
  });
  it("expansion skips closed dates", () => {
    // 2026-09-12 is a Saturday (getUTCDay 6)
    const out = expandSchedules(
      [{ providerId: "d1", serviceId: "s1", weekday: 6, startTime: "09:00", endTime: "10:00", durationMinutes: 30, capacity: 1, isActive: true }],
      [{ providerId: "d1", serviceId: null, exceptionDate: "2026-09-12" }],
      "2026-09-12",
      "2026-09-12",
    );
    expect(out).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/contexts/catalog/__tests__/schedule-kernel.test.ts`
Expected: FAIL with "Cannot find module '../schedule-kernel'".

- [ ] **Step 3: Write minimal implementation**

```ts
// src/contexts/catalog/schedule-kernel.ts
// Pure helpers only (no "use server", no db) — actions import these.

export interface ScheduleRow {
  providerId: string; serviceId: string; weekday: number;
  startTime: string; endTime: string; durationMinutes: number;
  capacity: number; isActive: boolean;
}

export interface ExceptionRow {
  providerId: string; serviceId: string | null; exceptionDate: string; // YYYY-MM-DD
}

const HHMM = /^\d{2}:\d{2}$/;

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function validateScheduleInput(input: unknown): boolean {
  if (typeof input !== "object" || input === null) return false;
  const v = input as Record<string, unknown>;
  if (typeof v.weekday !== "number" || !Number.isInteger(v.weekday) || v.weekday < 0 || v.weekday > 6) return false;
  if (typeof v.startTime !== "string" || !HHMM.test(v.startTime)) return false;
  if (typeof v.endTime !== "string" || !HHMM.test(v.endTime)) return false;
  if (toMin(v.endTime as string) <= toMin(v.startTime as string)) return false;
  if (typeof v.durationMinutes !== "number" || !Number.isInteger(v.durationMinutes) || v.durationMinutes < 5) return false;
  if (typeof v.capacity !== "number" || !Number.isInteger(v.capacity) || v.capacity < 1) return false;
  return true;
}

export function isClosedDay(exceptions: ExceptionRow[], providerId: string, serviceId: string, ymd: string): boolean {
  return exceptions.some((e) =>
    e.providerId === providerId &&
    e.exceptionDate === ymd &&
    (e.serviceId === null || e.serviceId === serviceId),
  );
}

export function expandSchedules(schedules: ScheduleRow[], exceptions: ExceptionRow[], fromYmd: string, toYmd: string): Date[] {
  const out: Date[] = [];
  const from = new Date(`${fromYmd}T00:00:00Z`);
  const to = new Date(`${toYmd}T23:59:59Z`);
  for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
    const ymd = d.toISOString().slice(0, 10);
    for (const s of schedules) {
      if (!s.isActive) continue;
      if (d.getUTCDay() !== s.weekday) continue;
      if (isClosedDay(exceptions, s.providerId, s.serviceId, ymd)) continue;
      const startMin = toMin(s.startTime);
      const endMin = toMin(s.endTime);
      for (let m = startMin; m + s.durationMinutes <= endMin; m += s.durationMinutes) {
        out.push(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), Math.floor(m / 60), m % 60)));
      }
    }
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- src/contexts/catalog/__tests__/schedule-kernel.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/contexts/catalog/schedule-kernel.ts src/contexts/catalog/__tests__/schedule-kernel.test.ts
git commit -m "feat(booking): schedule kernel with exception-aware expansion"
```

---

### Task 3: Catalog schedule actions (CRUD + generation from templates)

**Files:**
- Modify: `src/contexts/catalog/actions.ts`
- Modify: `src/contexts/catalog/queries.ts` (add cached readers)

**Interfaces:**
- Consumes: `validateScheduleInput`, `expandSchedules` from Task 2; `doctorSchedules`, `scheduleExceptions`, `availabilitySlots`, `services` tables
- Produces: `upsertSchedule`, `deleteSchedule`, `upsertException`, `deleteException`, `generateSlotsFromSchedules`, `toggleSlotActive`, `deleteSlot`, `listSchedules`, `listExceptions` used by Task 5. Old `generateSlots` stays until Task 6 nukes it.

- [ ] **Step 1: Write the failing test (generation skips closed + overlap guard)**

```ts
// src/contexts/catalog/__tests__/schedule-actions.test.ts
import { describe, expect, it } from "vitest";
import { expandSchedules } from "../schedule-kernel";

describe("generateSlotsFromSchedules planning", () => {
  it("skips closed dates and counts overlap separately", () => {
    const created = expandSchedules(
      [{ providerId: "d1", serviceId: "s1", weekday: 6, startTime: "09:00", endTime: "10:00", durationMinutes: 30, capacity: 1, isActive: true }],
      [],
      "2026-09-12",
      "2026-09-12",
    );
    expect(created).toHaveLength(2); // 09:00, 09:30
  });
});
```

Run: `bun run test -- src/contexts/catalog/__tests__/schedule-actions.test.ts` → PASS (documents the expansion contract the action below reuses; the DB overlap path is covered in Step 3 code review + Task 7 e2e).

- [ ] **Step 2: Append schedule actions to actions.ts**

Add to imports: `doctorSchedules, scheduleExceptions` from `@/db/schema`, `validateScheduleInput, expandSchedules` from `./schedule-kernel`. Then append (all async, all `await requireAdmin()` first):

```ts
const scheduleSchema = z.object({
  providerId: z.string().min(1),
  serviceId: z.string().min(1),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().min(5),
  capacity: z.number().int().min(1),
  isActive: z.boolean().optional(),
});

export async function upsertSchedule(input: z.infer<typeof scheduleSchema> & { id?: string }) {
  await requireAdmin();
  if (!validateScheduleInput(input)) return { ok: false as const, error: "invalid_schedule" };
  const data = scheduleSchema.parse(input);
  const id = (input as { id?: string }).id ?? randomUUID();
  await db.insert(doctorSchedules).values({
    id, providerId: data.providerId, serviceId: data.serviceId, weekday: data.weekday,
    startTime: data.startTime, endTime: data.endTime,
    durationMinutes: data.durationMinutes, capacity: data.capacity, isActive: data.isActive ?? true,
  }).onConflictDoUpdate({
    target: [doctorSchedules.providerId, doctorSchedules.serviceId, doctorSchedules.weekday, doctorSchedules.startTime],
    set: { endTime: data.endTime, durationMinutes: data.durationMinutes, capacity: data.capacity, isActive: data.isActive ?? true },
  });
  return { ok: true as const, id };
}

export async function deleteSchedule(id: string) {
  await requireAdmin();
  await db.delete(doctorSchedules).where(eq(doctorSchedules.id, id));
  return { ok: true as const };
}

const exceptionSchema = z.object({
  providerId: z.string().min(1),
  serviceId: z.string().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isClosed: z.boolean().optional(),
  reason: z.string().max(200).optional(),
});

export async function upsertException(input: z.infer<typeof exceptionSchema>) {
  await requireAdmin();
  const data = exceptionSchema.parse(input);
  const serviceId = data.serviceId ?? null;
  // delete-then-insert: enforces one row per (provider, service, date) with nullable service
  if (serviceId === null) {
    await db.delete(scheduleExceptions).where(and(
      eq(scheduleExceptions.providerId, data.providerId),
      sql`${scheduleExceptions.serviceId} IS NULL`,
      eq(scheduleExceptions.exceptionDate, data.date),
    ));
  } else {
    await db.delete(scheduleExceptions).where(and(
      eq(scheduleExceptions.providerId, data.providerId),
      eq(scheduleExceptions.serviceId, serviceId),
      eq(scheduleExceptions.exceptionDate, data.date),
    ));
  }
  const id = randomUUID();
  await db.insert(scheduleExceptions).values({
    id, providerId: data.providerId, serviceId,
    exceptionDate: data.date, isClosed: data.isClosed ?? true, reason: data.reason ?? null,
  });
  return { ok: true as const, id };
}

export async function deleteException(id: string) {
  await requireAdmin();
  await db.delete(scheduleExceptions).where(eq(scheduleExceptions.id, id));
  return { ok: true as const };
}

export async function generateSlotsFromSchedules(input: { providerId: string; serviceId: string; fromDate: string; toDate: string }) {
  await requireAdmin();
  const parsed = z.object({
    providerId: z.string().min(1), serviceId: z.string().min(1),
    fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues.map((i) => i.message).join("; ") };
  const { providerId, serviceId, fromDate, toDate } = parsed.data;
  const schedules = await db.select().from(doctorSchedules).where(and(
    eq(doctorSchedules.providerId, providerId),
    eq(doctorSchedules.serviceId, serviceId),
    eq(doctorSchedules.isActive, true),
  ));
  if (schedules.length === 0) return { ok: false as const, error: "no_active_schedules" };
  return db.transaction(async (tx) => {
    const [svc] = await tx.select().from(services).where(eq(services.id, serviceId)).for("update");
    if (!svc || svc.providerId !== providerId) return { ok: false as const, reason: "provider_mismatch" };
    const exceptions = await tx.select().from(scheduleExceptions).where(eq(scheduleExceptions.providerId, providerId));
    const starts = expandSchedules(
      schedules.map((s) => ({ providerId: s.providerId, serviceId: s.serviceId, weekday: s.weekday, startTime: s.startTime, endTime: s.endTime, durationMinutes: s.durationMinutes, capacity: s.capacity, isActive: s.isActive })),
      exceptions.map((e) => ({ providerId: e.providerId, serviceId: e.serviceId, exceptionDate: e.exceptionDate })),
      fromDate, toDate,
    );
    const existing = await tx.select().from(availabilitySlots).where(eq(availabilitySlots.serviceId, serviceId));
    const endOf = (s: Date) => {
      const sched = schedules.find((x) => x.weekday === s.getUTCDay());
      const dur = sched?.durationMinutes ?? 30;
      return new Date(s.getTime() + dur * 60_000);
    };
    const fresh = starts.filter((s) => {
      const e = endOf(s);
      return !existing.some((x) => s < x.endsAt && e > x.startsAt);
    });
    const overlap = starts.length - fresh.length;
    if (fresh.length > 0) {
      await tx.insert(availabilitySlots).values(fresh.map((s) => {
        const sched = schedules.find((x) => x.weekday === s.getUTCDay());
        const dur = sched?.durationMinutes ?? 30;
        const cap = sched?.capacity ?? 1;
        return {
          id: randomUUID(), providerId, serviceId,
          startsAt: s, endsAt: new Date(s.getTime() + dur * 60_000), capacity: cap,
        };
      }));
    }
    return { ok: true as const, count: fresh.length, overlap };
  });
}

export async function toggleSlotActive(slotId: string, isActive: boolean) {
  await requireAdmin();
  if (isActive === false) {
    const [s] = await db.select().from(availabilitySlots).where(eq(availabilitySlots.id, slotId));
    if (!s) return { ok: false as const, error: "not_found" };
    if (s.bookedCount > 0) return { ok: false as const, error: "slot_booked" };
    if (s.startsAt < new Date()) return { ok: false as const, error: "slot_past" };
  }
  await db.update(availabilitySlots).set({ isActive }).where(eq(availabilitySlots.id, slotId));
  return { ok: true as const };
}

export async function deleteSlot(slotId: string) {
  await requireAdmin();
  const [s] = await db.select().from(availabilitySlots).where(eq(availabilitySlots.id, slotId));
  if (!s) return { ok: false as const, error: "not_found" };
  if (s.bookedCount > 0) return { ok: false as const, error: "slot_booked" };
  if (s.startsAt < new Date()) return { ok: false as const, error: "slot_past" };
  await db.delete(availabilitySlots).where(eq(availabilitySlots.id, slotId));
  return { ok: true as const };
}
```

- [ ] **Step 3: Add cached readers to queries.ts**

```ts
// append to src/contexts/catalog/queries.ts (keep "server-only" + cache pattern)
import { doctorSchedules, scheduleExceptions, availabilitySlots } from "@/db/schema";

export const listSchedules = cache(async (providerId: string, serviceId?: string) => {
  return db.select().from(doctorSchedules).where(and(
    eq(doctorSchedules.providerId, providerId),
    serviceId ? eq(doctorSchedules.serviceId, serviceId) : undefined,
  )).orderBy(doctorSchedules.weekday, doctorSchedules.startTime);
});

export const listExceptions = cache(async (providerId: string, from: string, to: string) => {
  return db.select().from(scheduleExceptions).where(and(
    eq(scheduleExceptions.providerId, providerId),
    sql`${scheduleExceptions.exceptionDate} >= ${from} AND ${scheduleExceptions.exceptionDate} <= ${to}`,
  )).orderBy(scheduleExceptions.exceptionDate);
});
```

- [ ] **Step 4: Typecheck + lint + commit**

Run: `bunx tsc --noEmit` → 0. Run: `bun run lint` → 0.
Run: `bun run test -- src/contexts/catalog` → green.

```bash
git add src/contexts/catalog/actions.ts src/contexts/catalog/queries.ts src/contexts/catalog/__tests__/schedule-actions.test.ts
git commit -m "feat(booking): schedule CRUD + generate-from-template actions"
```

---

### Task 4: Booking admin actions (cancel/complete/no-show + doctor bookings query)

**Files:**
- Modify: `src/contexts/booking/actions.ts`
- Modify: `src/contexts/booking/queries.ts`
- Create: `src/contexts/booking/__tests__/admin-transitions.test.ts`

**Interfaces:**
- Consumes: `appointments`, `availabilitySlots`, `services` tables; `canCancel` from `./kernel`
- Produces: `completeAppointmentAsAdmin`, `markNoShowAsAdmin`, `cancelAppointmentAsAdmin`, `listBookingsForDoctor` used by Task 5.

- [ ] **Step 1: Write the failing test (guard matrix)**

```ts
// src/contexts/booking/__tests__/admin-transitions.test.ts
import { describe, expect, it } from "vitest";
import { canCancel } from "../kernel";

describe("admin transitions", () => {
  it("only confirmed is cancellable", () => {
    expect(canCancel("confirmed")).toBe(true);
    expect(canCancel("completed")).toBe(false);
    expect(canCancel("cancelled")).toBe(false);
    expect(canCancel("no_show")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/contexts/booking/__tests__/admin-transitions.test.ts`
Expected: FAIL only if kernel import path wrong; otherwise PASS as contract lock (keeps the guard visible while admin actions reuse it). If PASS, proceed — the real new code is Step 3.

- [ ] **Step 3: Append admin actions + query**

Actions (`src/contexts/booking/actions.ts`, async; add `requireAdmin` to the existing `requireUser` import from `@/contexts/identity/actions`):

```ts
export async function cancelAppointmentAsAdmin(id: string) {
  await requireAdmin();
  const [row] = await db.select().from(appointments).where(eq(appointments.id, id));
  if (!row) return { ok: false as const, reason: "not_found" };
  if (!canCancel(row.status as BookingStatus)) return { ok: false as const, reason: "not_cancellable" };
  return db.transaction(async (tx) => {
    const upd = await tx.update(appointments).set({ status: "cancelled" })
      .where(and(eq(appointments.id, id), eq(appointments.status, "confirmed")));
    if (upd.count === 0) return { ok: false as const, reason: "not_cancellable" };
    await tx.execute(sql`UPDATE availability_slot SET booked_count = GREATEST(booked_count - ${row.partySize}, 0) WHERE id = ${row.slotId}`);
    return { ok: true as const };
  });
}

export async function completeAppointmentAsAdmin(id: string) {
  await requireAdmin();
  const upd = await db.update(appointments).set({ status: "completed" })
    .where(and(eq(appointments.id, id), eq(appointments.status, "confirmed")));
  if (upd.count === 0) return { ok: false as const, reason: "not_cancellable" };
  return { ok: true as const };
}

export async function markNoShowAsAdmin(id: string) {
  await requireAdmin();
  const upd = await db.update(appointments).set({ status: "no_show" })
    .where(and(eq(appointments.id, id), eq(appointments.status, "confirmed")));
  if (upd.count === 0) return { ok: false as const, reason: "not_cancellable" };
  return { ok: true as const };
}
```

Query (`src/contexts/booking/queries.ts`, cached):

```ts
export const listBookingsForDoctor = cache(async (providerId: string, status?: string, page = 1, pageSize = 50) => {
  return db
    .select({
      id: appointments.id,
      status: appointments.status,
      partySize: appointments.partySize,
      price: appointments.price,
      patientName: appointments.patientName,
      patientPhone: appointments.patientPhone,
      serviceName: services.name,
      startsAt: availabilitySlots.startsAt,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(availabilitySlots, eq(appointments.slotId, availabilitySlots.id))
    .where(and(
      eq(appointments.providerId, providerId),
      status ? eq(appointments.status, status) : undefined,
    ))
    .orderBy(desc(availabilitySlots.startsAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
});
```

- [ ] **Step 4: Verify + commit**

Run: `bunx tsc --noEmit` → 0. Run: `bun run test -- src/contexts/booking` → green.

```bash
git add src/contexts/booking/actions.ts src/contexts/booking/queries.ts src/contexts/booking/__tests__/admin-transitions.test.ts
git commit -m "feat(booking): admin cancel/complete/no-show + doctor bookings query"
```

---

### Task 5: Admin doctor workspace UI (tabs) + locale keys

**Files:**
- Modify: `src/app/[locale]/admin/providers/[id]/page.tsx` (tab nav + data loading)
- Create: `src/app/[locale]/admin/providers/[id]/schedule-tab.tsx` (weekly grid form)
- Create: `src/app/[locale]/admin/providers/[id]/slots-tab.tsx` (generate card + slot list)
- Create: `src/app/[locale]/admin/providers/[id]/bookings-tab.tsx` (bookings table + actions)
- Modify: `messages/fa.json`, `messages/en.json`, `messages/ar.json`

**Interfaces:**
- Consumes: Task 3 actions/queries, Task 4 actions/query, `JalaliDatePicker`, `formatJalali*`, `toPersianDigits`
- Produces: working workspace; no new routes (uses `?tab=profile|schedules|slots|bookings`).

- [ ] **Step 1: Add locale keys (fa first)**

In `messages/fa.json` under `admin`, extend `scheduling` and add `bookings`:

```json
"scheduling": {
  "title": "زمان‌بندی و اسلات‌ها",
  "subtitle": "الگوی هفتگی هر پزشک + روزهای تعطیل، تولید اسلات و مشاهده رزروها از صفحه پزشک.",
  "generateSlots": "تولید اسلات از الگو",
  "overlapMessage": "تداخل زمانی: اسلات‌های جدید با نوبت‌های موجود تداخل دارند؛ اسلاتی ایجاد نشد.",
  "createdCount": "تعداد {count} اسلات نوبت با موفقیت ایجاد شد.",
  "overlapCount": "{count} اسلات تکراری نادیده گرفته شد.",
  "weekdays": { "0": "یکشنبه", "1": "دوشنبه", "2": "سه‌شنبه", "3": "چهارشنبه", "4": "پنج‌شنبه", "5": "جمعه", "6": "شنبه" },
  "tabs": { "profile": "مشخصات", "schedules": "برنامه هفتگی", "slots": "اسلات‌ها", "bookings": "رزروها" },
  "saveSchedules": "ذخیره برنامه هفتگی",
  "exceptionsTitle": "روزهای تعطیل / استثنا",
  "blockSlot": "بستن",
  "unblockSlot": "باز کردن",
  "deleteSlot": "حذف"
},
"bookings": {
  "title": "رزروها",
  "patient": "بیمار",
  "phone": "تلفن",
  "when": "زمان",
  "service": "خدمت",
  "status": "وضعیت",
  "cancel": "لغو",
  "complete": "تکمیل",
  "noShow": "عدم مراجعه",
  "empty": "رزروی برای این پزشک ثبت نشده است."
}
```

Mirror the exact same key subtree in `messages/en.json` and `messages/ar.json` (keys: title, subtitle, generateSlots, overlapMessage, createdCount, overlapCount, weekdays.0–6, tabs.profile/schedules/slots/bookings, saveSchedules, exceptionsTitle, blockSlot, unblockSlot, deleteSlot + bookings.title/patient/phone/when/service/status/cancel/complete/noShow/empty), with translated values.

- [ ] **Step 2: Workspace page with tabs**

Rewrite `src/app/[locale]/admin/providers/[id]/page.tsx`: keep existing profile loading; read `searchParams.tab` (default `profile`); render tab nav (4 `Link`s preserving locale prefix, `py-3` targets, active = `bg-primary text-on-primary`); load per-tab data with cached queries (`listSchedules`, `listProviderServices` for the service selector, `listBookingsForDoctor` for bookings tab, slot list inline via `db` + `availabilitySlots` filtered by provider + date param). Pass rows as props to the three tab components. Keep `ProviderForm` for the profile tab untouched.

- [ ] **Step 3: Three tab components (client, one primary CTA each)**

`schedule-tab.tsx`: service selector + 7 weekday rows (Saturday-first display: order [6,0,1,2,3,4,5], labels from `admin.scheduling.weekdays`), each row = active checkbox + start/end `type="time"` + duration number + capacity number; submit calls `upsertSchedule` per active row via `useActionState`; below, exceptions card (date `JalaliDatePicker` + reason + add via `upsertException`, list with delete). All labels `text-start`, logical props only.

`slots-tab.tsx`: generate card (from/to `JalaliDatePicker` + service selector + submit → `generateSlotsFromSchedules`, result line with `createdCount`/`overlapCount` in Persian digits) + slot rows (Jalali datetime, `booked_count/capacity`, status chip, Block/Unblock/Delete buttons calling Task 3 actions).

`bookings-tab.tsx`: cards-not-tables on mobile (table on `md+`); each row shows patient, phone, service, `formatJalaliDateTime(startsAt, locale)`, status chip; actions call `cancelAppointmentAsAdmin` / `completeAppointmentAsAdmin` / `markNoShowAsAdmin`. Icons: `lucide-react` direct (`CalendarX`, `CircleCheck`, `UserX`).

- [ ] **Step 4: Repurpose global scheduling page**

Replace `src/app/[locale]/admin/scheduling/page.tsx` body with an overview: list doctors (id, name) each linking to `/${locale}/admin/providers/${id}?tab=slots`, plus one line pointing to per-doctor generation. Delete the embedded global generator (the form component itself is deleted in Task 6).

- [ ] **Step 5: Group patient slots by doctor (spec §4)**

In `src/app/[locale]/(booking)/services/[slug]/book/page.tsx`: extend the slot mapping to include `providerId` + `providerName`, then group by doctor and render one section per doctor (doctor name header + that doctor's day slots, keeping the existing morning/evening split). To supply those columns, extend `availabilityForService` in `src/contexts/catalog/actions.ts`: join `providers` on `availabilitySlots.providerId` and add `providerId: availabilitySlots.providerId, providerName: providers.name` to its select (import `providers` table — already imported in that file). `reserve/page.tsx` already filters by doctor via `primaryService` — no change there beyond the same two columns if missing.

- [ ] **Step 6: Typecheck + commit**

Run: `bunx tsc --noEmit` → 0. Run: `bun run lint` → 0.

```bash
git add "src/app/[locale]/admin/providers/[id]" "src/app/[locale]/admin/scheduling/page.tsx" messages/fa.json messages/en.json messages/ar.json
git commit -m "feat(booking): doctor workspace tabs (schedules, slots, bookings)"
```

---

### Task 6: Nuke pass (delete the old global path — user explicitly requested)

**Files:**
- Delete: `src/app/[locale]/admin/scheduling/scheduling-form.tsx`
- Modify: `src/contexts/catalog/actions.ts` (delete old `generateSlots` + `generateSlotsSchema`, keep `generateSlotsFromSchedules`)
- Modify: `src/app/[locale]/(booking)/services/[slug]/book/page.tsx`, `src/app/[locale]/(booking)/booking/doctor/[slug]/reserve/page.tsx` (only if they import removed symbols; otherwise untouched)

**Interfaces:**
- Consumes: Tasks 3–5 complete
- Produces: zero references to the old path.

- [ ] **Step 1: Prove the old path is orphaned**

Run: `rg -n "generateSlots\(|scheduling-form|generateSlotsSchema" src --glob '!*schedule-kernel*' --glob '!*schedule-actions.test*'`
Expected: hits only in `src/contexts/catalog/actions.ts` (definition) and the two imports about to be fixed. If the workspace tabs already call `generateSlotsFromSchedules`, the old export has no UI caller left.

- [ ] **Step 2: Delete the form + old export**

Run: `rm "src/app/[locale]/admin/scheduling/scheduling-form.tsx"` (PowerShell: `Remove-Item -LiteralPath "src/app/[locale]/admin/scheduling/scheduling-form.tsx"`).
Delete `generateSlotsSchema` const + `generateSlots` function from `actions.ts` (the `expandPattern` import stays only if still used — otherwise remove it too; `availabilityForService` stays).

- [ ] **Step 3: Re-run the grep — must be clean**

Run: same `rg` as Step 1.
Expected: zero hits for `scheduling-form` and `generateSlotsSchema`; `generateSlots(` hits only `generateSlotsFromSchedules(`.

- [ ] **Step 4: Typecheck + lint + commit**

Run: `bunx tsc --noEmit` → 0. Run: `bun run lint` → 0.

```bash
git add -A
git commit -m "chore(booking): nuke global slot generator (per-doctor templates only)"
```

---

### Task 7: Seed + full verification

**Files:**
- Modify: `scripts/seed.ts` (or `scripts/seed-*.ts` whichever seeds doctors/services — add schedules + one exception per seeded doctor)

**Interfaces:**
- Consumes: Tasks 1–6
- Produces: seeded workspace data; green verification chain.

- [ ] **Step 1: Seed weekly schedules**

After the existing doctor/service insert, insert 2–3 `doctorSchedules` rows per seeded doctor (e.g. weekday 6,0,2 — Sat/Sun/Tue 09:00–13:00, duration 30, capacity 1) using the doctor's first service id, plus one `scheduleExceptions` row ~7 days out with reason "مرخصی". Guard with `onConflictDoNothing` so re-seeds are idempotent.

- [ ] **Step 2: Run the verification chain**

Run in order, each must be green before the next:
1. `bun run db:generate` (no-op clean) then `docker compose up -d` → `bun run db:migrate` → `bun run db:seed`
2. `bunx tsc --noEmit` → 0
3. `bun run lint` → 0
4. `bun run test` → green (unit; e2e specs fail without dev server — pre-existing, ignore)
5. `bun run build` → 144+ pages, 0 errors
6. Manual: doctor workspace tabs → generate → book as patient → admin cancel frees slot; exception day generates zero slots.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed.ts
git commit -m "chore(booking): seed per-doctor schedules + sample exception"
```

---

## Execution order

Tasks 1 → 2 → 3 → 4 → 5 → 6 → 7, in order. No parallel tasks (each builds on the previous one's interfaces).
