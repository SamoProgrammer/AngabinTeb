"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { sql, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { appointments, services, notifications } from "@/db/schema";
import { requireUser } from "@/contexts/identity/actions";
import { checkRateLimit, BOOKING_RULE } from "@/lib/rate-limit";
import { canCancel, validatePartySize, type BookingStatus } from "./kernel";

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const bookSchema = z.object({
  serviceId: z.string().min(1),
  slotId: z.string().min(1),
  partySize: z.number(),
  patientName: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(120).optional()),
  patientPhone: z.preprocess(
    emptyToUndefined,
    // Lenient: digits (Latin + Persian/Arabic-Indic), +, spaces, dashes, parens, dots.
    z.string().trim().min(1).max(32).regex(/^[+()\-\s.\d۰-۹٠-٩]*$/, "invalid_phone").optional(),
  ),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().min(8).max(64),
});

class RescheduleCapacityError extends Error {}

export async function bookAppointment(input: z.infer<typeof bookSchema>) {
  const user = await requireUser();
  return bookAppointmentWithUser(user, input);
}

// Ruling R23: seam for the Task 1.8 test-only api-test route (e2e has no OTP
// path); the transaction itself lives in exactly one place.
// The optional db override keeps this seam usable against a disposable test
// database without touching the dev database.
export async function bookAppointmentWithUser(
  user: { id: string },
  input: z.infer<typeof bookSchema>,
  dbc: typeof db = db,
) {
  const data = bookSchema.parse(input);
  if (!validatePartySize(data.partySize)) return { ok: false as const, reason: "invalid_party" };
  if (!checkRateLimit(`booking:${user.id}`, BOOKING_RULE).ok) {
    return { ok: false as const, reason: "rate_limited" };
  }

  return dbc.transaction(async (tx) => {
    const [svc] = await tx.select().from(services).where(eq(services.id, data.serviceId));
    if (!svc) return { ok: false as const, reason: "capacity_exceeded" }; // stale/deleted service
    const slotRes = await tx.execute(
      sql`UPDATE availability_slot
            SET booked_count = booked_count + ${data.partySize},
                held_until = NULL, held_by = NULL
          WHERE id = ${data.slotId}
            AND service_id = ${data.serviceId}
            AND is_active = true
            AND starts_at > now()
            AND booked_count + ${data.partySize} <= capacity
            AND (held_until IS NULL OR held_until < now())`,
    );
    if (slotRes.count === 0) return { ok: false as const, reason: "capacity_exceeded" };

    const appointmentId = randomUUID();
    await tx.insert(appointments).values({
      id: appointmentId,
      patientId: user.id,
      serviceId: data.serviceId,
      providerId: svc.providerId,
      locationId: svc.locationId ?? null,
      slotId: data.slotId,
      partySize: data.partySize,
      price: svc.basePrice,
      status: "confirmed",
      notes: data.notes ?? null,
      patientName: data.patientName ?? null,
      patientPhone: data.patientPhone ?? null,
      idempotencyKey: data.idempotencyKey,
    });
    await tx.insert(notifications).values({
      id: randomUUID(),
      userId: user.id,
      kind: "appointment_confirmed",
      title: "Appointment confirmed",
      body: `Your booking is confirmed (${appointmentId}).`,
    });
    return { ok: true as const, appointmentId };
  });
}

export async function cancelAppointment(id: string) {
  const user = await requireUser();
  const [row] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, id), eq(appointments.patientId, user.id)));
  if (!row) return { ok: false as const, reason: "not_found" };
  if (!canCancel(row.status as BookingStatus)) return { ok: false as const, reason: "not_cancellable" };

  return db.transaction(async (tx) => {
    const upd = await tx.update(appointments)
      .set({ status: "cancelled" })
      .where(and(eq(appointments.id, id), eq(appointments.status, "confirmed")));
    if (upd.count === 0) return { ok: false as const, reason: "not_cancellable" };
    await tx.execute(
      sql`UPDATE availability_slot
            SET booked_count = GREATEST(booked_count - ${row.partySize}, 0)
          WHERE id = ${row.slotId}`,
    );
    return { ok: true as const };
  });
}

// Cancel-plus-create with capacity re-check (spec C4): the old appointment is
// preserved as a cancelled record, its slot capacity is freed, and the new
// booking takes capacity on the target slot — all in one transaction, so a
// capacity failure rolls everything back and the original booking survives.
// The conditional UPDATEs are the enforcement points: the cancel only fires
// on a still-confirmed row (double-reschedule race loses), and the take only
// fires when the target slot has room (double-take of the freed slot loses).
export async function rescheduleAppointment(id: string, newSlotId: string) {
  const user = await requireUser();
  return rescheduleAppointmentWithUser(user, id, newSlotId);
}

export async function rescheduleAppointmentWithUser(
  user: { id: string },
  id: string,
  newSlotId: string,
  dbc: typeof db = db,
) {
  if (!checkRateLimit(`booking:${user.id}`, BOOKING_RULE).ok) {
    return { ok: false as const, reason: "rate_limited" };
  }
  const [row] = await dbc
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, id), eq(appointments.patientId, user.id)));
  if (!row || !canCancel(row.status as BookingStatus)) return { ok: false as const, reason: "not_cancellable" };
  if (row.slotId === newSlotId) return { ok: false as const, reason: "same_slot" };

  try {
    return await dbc.transaction(async (tx) => {
      const cancelled = await tx.update(appointments)
        .set({ status: "cancelled" })
        .where(and(eq(appointments.id, id), eq(appointments.status, "confirmed")));
      if (cancelled.count === 0) return { ok: false as const, reason: "not_cancellable" };
      await tx.execute(
        sql`UPDATE availability_slot
              SET booked_count = GREATEST(booked_count - ${row.partySize}, 0)
            WHERE id = ${row.slotId}`,
      );
      const slotRes = await tx.execute(
        sql`UPDATE availability_slot
              SET booked_count = booked_count + ${row.partySize},
                  held_until = NULL, held_by = NULL
            WHERE id = ${newSlotId}
              AND service_id = ${row.serviceId}
              AND is_active = true
              AND starts_at > now()
              AND booked_count + ${row.partySize} <= capacity
              AND (held_until IS NULL OR held_until < now())`,
      );
      if (slotRes.count === 0) {
        throw new RescheduleCapacityError();
      }

      const newId = randomUUID();
      await tx.insert(appointments).values({
        id: newId,
        patientId: user.id,
        serviceId: row.serviceId,
        providerId: row.providerId,
        locationId: row.locationId,
        slotId: newSlotId,
        partySize: row.partySize,
        price: row.price,
        notes: row.notes,
        patientName: row.patientName,
        patientPhone: row.patientPhone,
        idempotencyKey: `reschedule-${row.id}-${newSlotId}`,
      });
      await tx.insert(notifications).values({
        id: randomUUID(),
        userId: user.id,
        kind: "appointment_rescheduled",
        title: "Appointment rescheduled",
        body: `Your booking moved to a new slot (${newId}).`,
      });
      return { ok: true as const, appointmentId: newId };
    });
  } catch (e) {
    if (e instanceof RescheduleCapacityError) return { ok: false as const, reason: "capacity_exceeded" };
    throw e;
  }
}