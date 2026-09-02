"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { sql, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { appointments, services, notifications } from "@/db/schema";
import { requireUser } from "@/contexts/identity/actions";
import { canCancel, validatePartySize, type BookingStatus } from "./kernel";

const bookSchema = z.object({
  serviceId: z.string().min(1),
  slotId: z.string().min(1),
  partySize: z.number(),
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
export async function bookAppointmentWithUser(
  user: { id: string },
  input: z.infer<typeof bookSchema>,
) {
  const data = bookSchema.parse(input);
  if (!validatePartySize(data.partySize)) return { ok: false as const, reason: "invalid_party" };

  return db.transaction(async (tx) => {
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

// ponytail: reschedule UI (dashboard button + slot picker) deferred to Phase 2;
// the action and kernel are implemented and tested (spec §6.3 cancel+create).
export async function rescheduleAppointment(id: string, newSlotId: string) {
  const user = await requireUser();
  const [row] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, id), eq(appointments.patientId, user.id)));
  if (!row || !canCancel(row.status as BookingStatus)) return { ok: false as const, reason: "not_cancellable" };

  try {
    return await db.transaction(async (tx) => {
      await tx.update(appointments).set({ status: "cancelled" }).where(eq(appointments.id, id));
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
        idempotencyKey: `reschedule-${row.id}-${newSlotId}`,
      });
      return { ok: true as const, appointmentId: newId };
    });
  } catch (e) {
    if (e instanceof RescheduleCapacityError) return { ok: false as const, reason: "capacity_exceeded" };
    throw e;
  }
}