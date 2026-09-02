"use server";

import { z } from "zod";
import { sql, and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { providers, practitioners, diagnosticServices, services, availabilitySlots, serviceCategories, locations, translations } from "@/db/schema";
import { requireAdmin } from "@/contexts/identity/actions";

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

export function expandPattern(input: {
  weekday: number; // 0=Sun … 6=Sat
  startsAt: string; // "HH:MM"
  endsAt: string;
  durationMinutes: number;
  from: Date;
  to: Date;
}): Date[] {
  const [sh, sm] = input.startsAt.split(":").map(Number);
  const [eh, em] = input.endsAt.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (endMin <= startMin) throw new Error("endsAt must be after startsAt");
  const out: Date[] = [];
  for (let d = new Date(input.from); d <= input.to; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() !== input.weekday) continue;
    for (let m = startMin; m + input.durationMinutes <= endMin; m += input.durationMinutes) {
      const slot = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), Math.floor(m / 60), m % 60));
      out.push(slot);
    }
  }
  return out;
}

const generateSlotsSchema = z.object({
  serviceId: z.string().min(1),
  providerId: z.string().min(1),
  weekday: z.number().int().min(0).max(6),
  startsAt: z.string().regex(/^\d{2}:\d{2}$/),
  endsAt: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().positive(),
  capacity: z.number().int().min(1),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function generateSlots(input: z.infer<typeof generateSlotsSchema>) {
  await requireAdmin();
  const parsed = parseOrError(generateSlotsSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  const starts = expandPattern({
    weekday: data.weekday, startsAt: data.startsAt, endsAt: data.endsAt,
    durationMinutes: data.durationMinutes,
    from: new Date(`${data.fromDate}T00:00:00Z`), to: new Date(`${data.toDate}T23:59:59Z`),
  });
  return db.transaction(async (tx) => {
    const [svc] = await tx.select().from(services).where(eq(services.id, data.serviceId)).for("update");
    if (!svc || svc.providerId !== data.providerId) {
      return { ok: false as const, reason: "provider_mismatch" };
    }
    const existing = await tx.select().from(availabilitySlots)
      .where(eq(availabilitySlots.serviceId, data.serviceId));
    const overlap = starts.filter((s) =>
      existing.some((e) =>
        s < e.endsAt && new Date(s.getTime() + data.durationMinutes * 60_000) > e.startsAt,
      ),
    );
    if (overlap.length > 0) {
      return { ok: false as const, reason: "overlap", count: overlap.length };
    }
    await tx.insert(availabilitySlots).values(
      starts.map((s) => ({
        id: randomUUID(),
        providerId: data.providerId,
        serviceId: data.serviceId,
        startsAt: s,
        endsAt: new Date(s.getTime() + data.durationMinutes * 60_000),
        capacity: data.capacity,
      })),
    );
    return { ok: true as const, count: starts.length };
  });
}

export async function availabilityForService(serviceId: string, date: string) {
  const start = new Date(`${date}T00:00:00Z`);
  const end = new Date(`${date}T23:59:59Z`);
  return db
    .select()
    .from(availabilitySlots)
    .where(and(
      eq(availabilitySlots.serviceId, serviceId),
      eq(availabilitySlots.isActive, true),
      sql`${availabilitySlots.startsAt} > now()`,
      sql`${availabilitySlots.startsAt} >= ${start} AND ${availabilitySlots.startsAt} <= ${end}`,
      sql`(${availabilitySlots.heldUntil} IS NULL OR ${availabilitySlots.heldUntil} < now())`,
    ))
    .orderBy(availabilitySlots.startsAt);
}