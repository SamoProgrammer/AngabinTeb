"use server";

import { z } from "zod";
import { sql, and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { providers, practitioners, diagnosticServices, services, availabilitySlots, serviceCategories, locations, translations, doctorSchedules, scheduleExceptions } from "@/db/schema";
import { requireAdmin } from "@/contexts/identity/actions";
import { validateScheduleInput, expandSchedules } from "./schedule-kernel";

function parseOrError<T>(schema: z.ZodType<T>, input: unknown): { ok: true; data: T } | { ok: false; error: string } {
  const r = schema.safeParse(input);
  if (!r.success) return { ok: false, error: r.error.issues.map((i) => i.message).join("; ") };
  return { ok: true, data: r.data };
}

const providerSchema = z.object({
  kind: z.enum(["person", "organization"]),
  orgType: z.enum(["clinic", "office", "service_org"]).nullable().optional(),
  nameFa: z.string().min(1),
  nameEn: z.string().optional(),
  nameAr: z.string().optional(),
  phone: z.string().optional(),
  specialtyId: z.string().optional(),
  bioFa: z.string().optional(),
});

export async function createProvider(input: z.infer<typeof providerSchema>) {
  await requireAdmin();
  const parsed = parseOrError(providerSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(providers).values({
      id, kind: data.kind, orgType: data.orgType ?? null,
      name: data.nameFa, phone: data.phone ?? null,
    });
    if (data.kind === "person") {
      await tx.insert(practitioners).values({
        providerId: id, specialtyId: data.specialtyId ?? null, bio: data.bioFa ?? null,
      });
    }
    for (const [locale, value] of [["en", data.nameEn], ["ar", data.nameAr]] as const) {
      if (value) await tx.insert(translations).values({ entityType: "provider", entityId: id, locale, field: "name", value });
    }
  });
  return { ok: true as const, id };
}

export async function updateProvider(id: string, input: z.infer<typeof providerSchema>) {
  await requireAdmin();
  const parsed = parseOrError(providerSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  await db.transaction(async (tx) => {
    await tx.update(providers).set({
      kind: data.kind, orgType: data.orgType ?? null,
      name: data.nameFa, phone: data.phone ?? null,
    }).where(eq(providers.id, id));
    if (data.kind === "person") {
      await tx.insert(practitioners).values({
        providerId: id, specialtyId: data.specialtyId ?? null, bio: data.bioFa ?? null,
      }).onConflictDoUpdate({
        target: practitioners.providerId,
        set: { specialtyId: data.specialtyId ?? null, bio: data.bioFa ?? null },
      });
    } else {
      await tx.delete(practitioners).where(eq(practitioners.providerId, id));
    }
    await tx.delete(translations).where(and(eq(translations.entityType, "provider"), eq(translations.entityId, id)));
    for (const [locale, value] of [["en", data.nameEn], ["ar", data.nameAr]] as const) {
      if (value) await tx.insert(translations).values({ entityType: "provider", entityId: id, locale, field: "name", value });
    }
  });
  return { ok: true as const, id };
}

const serviceSchema = z.object({
  providerId: z.string().min(1),
  categoryId: z.string().min(1),
  serviceType: z.enum(["diagnostic", "therapy", "home_care", "rehab", "ambulance", "consultation"]),
  locationId: z.string().optional(),
  nameFa: z.string().min(1),
  nameEn: z.string().optional(),
  nameAr: z.string().optional(),
  durationMinutes: z.number().int().positive(),
  basePrice: z.string().regex(/^\d+$/),
  prepInstructionsFa: z.string().optional(),
  fastingHours: z.number().int().nonnegative().optional(),
});

export async function createService(input: z.infer<typeof serviceSchema>) {
  await requireAdmin();
  const parsed = parseOrError(serviceSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(services).values({
      id, providerId: data.providerId, categoryId: data.categoryId,
      serviceType: data.serviceType, locationId: data.locationId ?? null,
      name: data.nameFa, durationMinutes: data.durationMinutes, basePrice: data.basePrice,
    });
    if (data.serviceType === "diagnostic") {
      await tx.insert(diagnosticServices).values({
        serviceId: id, prepInstructions: data.prepInstructionsFa ?? null, fastingHours: data.fastingHours ?? null,
      });
    }
    for (const [locale, value] of [["en", data.nameEn], ["ar", data.nameAr]] as const) {
      if (value) await tx.insert(translations).values({ entityType: "service", entityId: id, locale, field: "name", value });
    }
  });
  return { ok: true as const, id };
}

export async function updateService(id: string, input: z.infer<typeof serviceSchema>) {
  await requireAdmin();
  const parsed = parseOrError(serviceSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  await db.transaction(async (tx) => {
    await tx.update(services).set({
      providerId: data.providerId, categoryId: data.categoryId,
      serviceType: data.serviceType, locationId: data.locationId ?? null,
      name: data.nameFa, durationMinutes: data.durationMinutes, basePrice: data.basePrice,
    }).where(eq(services.id, id));
    if (data.serviceType === "diagnostic") {
      await tx.insert(diagnosticServices).values({
        serviceId: id, prepInstructions: data.prepInstructionsFa ?? null, fastingHours: data.fastingHours ?? null,
      }).onConflictDoUpdate({
        target: diagnosticServices.serviceId,
        set: { prepInstructions: data.prepInstructionsFa ?? null, fastingHours: data.fastingHours ?? null },
      });
    } else {
      await tx.delete(diagnosticServices).where(eq(diagnosticServices.serviceId, id));
    }
    await tx.delete(translations).where(and(eq(translations.entityType, "service"), eq(translations.entityId, id)));
    for (const [locale, value] of [["en", data.nameEn], ["ar", data.nameAr]] as const) {
      if (value) await tx.insert(translations).values({ entityType: "service", entityId: id, locale, field: "name", value });
    }
  });
  return { ok: true as const, id };
}

const categorySchema = z.object({
  slug: z.string().min(1),
  nameFa: z.string().min(1),
  nameEn: z.string().optional(),
  nameAr: z.string().optional(),
});

export async function createCategory(input: z.infer<typeof categorySchema>) {
  await requireAdmin();
  const parsed = parseOrError(categorySchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(serviceCategories).values({ id, slug: data.slug, name: data.nameFa });
    for (const [locale, value] of [["en", data.nameEn], ["ar", data.nameAr]] as const) {
      if (value) await tx.insert(translations).values({ entityType: "service_category", entityId: id, locale, field: "name", value });
    }
  });
  return { ok: true as const, id };
}

export async function updateCategory(id: string, input: z.infer<typeof categorySchema>) {
  await requireAdmin();
  const parsed = parseOrError(categorySchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  await db.transaction(async (tx) => {
    await tx.update(serviceCategories).set({ slug: data.slug, name: data.nameFa }).where(eq(serviceCategories.id, id));
    await tx.delete(translations).where(and(eq(translations.entityType, "service_category"), eq(translations.entityId, id)));
    for (const [locale, value] of [["en", data.nameEn], ["ar", data.nameAr]] as const) {
      if (value) await tx.insert(translations).values({ entityType: "service_category", entityId: id, locale, field: "name", value });
    }
  });
  return { ok: true as const, id };
}

const locationSchema = z.object({
  providerId: z.string().min(1),
  label: z.string().min(1),
  labelEn: z.string().optional(),
  labelAr: z.string().optional(),
  addressLine: z.string().optional(),
  cityId: z.string().min(1),
  phone: z.string().optional(),
});

export async function createLocation(input: z.infer<typeof locationSchema>) {
  await requireAdmin();
  const parsed = parseOrError(locationSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(locations).values({
      id, providerId: data.providerId, label: data.label,
      addressLine: data.addressLine ?? null, cityId: data.cityId, phone: data.phone ?? null,
    });
    for (const [locale, value] of [["en", data.labelEn], ["ar", data.labelAr]] as const) {
      if (value) await tx.insert(translations).values({ entityType: "location", entityId: id, locale, field: "label", value });
    }
  });
  return { ok: true as const, id };
}

export async function updateLocation(id: string, input: z.infer<typeof locationSchema>) {
  await requireAdmin();
  const parsed = parseOrError(locationSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  await db.transaction(async (tx) => {
    await tx.update(locations).set({
      providerId: data.providerId, label: data.label,
      addressLine: data.addressLine ?? null, cityId: data.cityId, phone: data.phone ?? null,
    }).where(eq(locations.id, id));
    await tx.delete(translations).where(and(eq(translations.entityType, "location"), eq(translations.entityId, id)));
    for (const [locale, value] of [["en", data.labelEn], ["ar", data.labelAr]] as const) {
      if (value) await tx.insert(translations).values({ entityType: "location", entityId: id, locale, field: "label", value });
    }
  });
  return { ok: true as const, id };
}

export async function availabilityForService(serviceId: string, date: string) {
  const start = new Date(`${date}T00:00:00Z`);
  const end = new Date(`${date}T23:59:59Z`);
  return db
    .select({
      id: availabilitySlots.id,
      startsAt: availabilitySlots.startsAt,
      capacity: availabilitySlots.capacity,
      bookedCount: availabilitySlots.bookedCount,
      providerId: availabilitySlots.providerId,
      providerName: providers.name,
    })
    .from(availabilitySlots)
    .innerJoin(providers, eq(providers.id, availabilitySlots.providerId))
    .where(and(
      eq(availabilitySlots.serviceId, serviceId),
      eq(availabilitySlots.isActive, true),
      sql`${availabilitySlots.startsAt} > now()`,
      sql`${availabilitySlots.startsAt} >= ${start} AND ${availabilitySlots.startsAt} <= ${end}`,
      sql`(${availabilitySlots.heldUntil} IS NULL OR ${availabilitySlots.heldUntil} < now())`,
    ))
    .orderBy(availabilitySlots.startsAt);
}

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
    // Spec §5 shape (created/skippedClosed) + brief verbatim `count` alias for Task 5 compat.
    const unclosed = expandSchedules(
      schedules.map((s) => ({ providerId: s.providerId, serviceId: s.serviceId, weekday: s.weekday, startTime: s.startTime, endTime: s.endTime, durationMinutes: s.durationMinutes, capacity: s.capacity, isActive: s.isActive })),
      [],
      fromDate, toDate,
    );
    const skippedClosed = unclosed.length - starts.length;
    return { ok: true as const, count: fresh.length, created: fresh.length, skippedClosed, overlap };
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