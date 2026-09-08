"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import { sql, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { physiologyProfiles, foodIntakes, foods, servingUnits, foodNutrients, dailyNutrition, dietPrograms, dietClaims, nutrients, translations, intakePeriods } from "@/db/schema";
import { requireAdmin, requireUser } from "@/contexts/identity/actions";
import { servingToGrams, nutrientsForIntake } from "./kernel";
import { getPhysiology } from "./queries";

function parseOrError<T>(schema: z.ZodType<T>, input: unknown): { ok: true; data: T } | { ok: false; error: string } {
  const r = schema.safeParse(input);
  if (!r.success) return { ok: false, error: r.error.issues.map((i) => i.message).join("; ") };
  return { ok: true, data: r.data };
}

const physiologySchema = z.object({
  sex: z.enum(["male", "female"]),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  heightCm: z.number().min(80).max(250),
  weightKg: z.number().min(25).max(300),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
});

export async function savePhysiology(input: FormData) {
  const user = await requireUser();
  const parsed = physiologySchema.safeParse({
    sex: input.get("sex"),
    birthDate: input.get("birthDate"),
    heightCm: Number(input.get("heightCm")),
    weightKg: Number(input.get("weightKg")),
    activityLevel: input.get("activityLevel"),
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues.map((i) => i.message).join("; ") };
  const data = parsed.data;
  await db
    .insert(physiologyProfiles)
    .values({ userId: user.id, ...data, heightCm: String(data.heightCm), weightKg: String(data.weightKg) })
    .onConflictDoUpdate({ target: physiologyProfiles.userId, set: { ...data, heightCm: String(data.heightCm), weightKg: String(data.weightKg), updatedAt: new Date() } });
  return { ok: true as const };
}

const intakeSchema = z.object({
  foodId: z.string().min(1),
  servingUnitId: z.string().min(1),
  quantity: z.number().positive(),
});

export async function logIntake(input: z.infer<typeof intakeSchema>) {
  const user = await requireUser();
  const parsed = intakeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues.map((i) => i.message).join("; ") };
  const data = parsed.data;

  await db.transaction(async (tx) => {
    const [food] = await tx.select().from(foods).where(eq(foods.id, data.foodId));
    const [su] = await tx.select().from(servingUnits).where(eq(servingUnits.id, data.servingUnitId));
    if (!food || !su || su.foodId !== data.foodId) throw new Error("invalid serving unit for food");
    const rows = await tx
      .select()
      .from(foodNutrients)
      .where(eq(foodNutrients.foodId, data.foodId));

    const per100g = Object.fromEntries(rows.map((r) => [r.nutrientId, Number(r.amountPer100g)]));
    const grams = servingToGrams(data.quantity, Number(su.gramsEquivalent));
    const values = nutrientsForIntake(grams, per100g);

    await tx.insert(foodIntakes).values({ id: randomUUID(), userId: user.id, foodId: data.foodId, servingUnitId: data.servingUnitId, quantity: String(data.quantity) });
    await tx.insert(dailyNutrition).values({
      userId: user.id,
      day: new Date().toISOString().slice(0, 10),
      energyKcal: String(values["n-energy"] ?? 0),
      carbsG: String(values["n-carbs"] ?? 0),
      proteinG: String(values["n-protein"] ?? 0),
      fatG: String(values["n-fat"] ?? 0),
    }).onConflictDoUpdate({
      target: [dailyNutrition.userId, dailyNutrition.day],
      set: {
        energyKcal: sql`${dailyNutrition.energyKcal} + ${values["n-energy"] ?? 0}`,
        carbsG: sql`${dailyNutrition.carbsG} + ${values["n-carbs"] ?? 0}`,
        proteinG: sql`${dailyNutrition.proteinG} + ${values["n-protein"] ?? 0}`,
        fatG: sql`${dailyNutrition.fatG} + ${values["n-fat"] ?? 0}`,
      },
    });
  });
  return { ok: true as const };
}

const claimSchema = z.object({ programId: z.string().min(1) });

export async function claimDietProgram(input: FormData) {
  const user = await requireUser();
  const parsed = claimSchema.safeParse({ programId: input.get("programId") });
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues.map((i) => i.message).join("; ") };
  const programId = parsed.data.programId;

  const [program] = await db.select({ id: dietPrograms.id }).from(dietPrograms).where(eq(dietPrograms.id, programId));
  if (!program) return { ok: false as const, reason: "not_found" as const };

  const [existing] = await db
    .select({ id: dietClaims.id })
    .from(dietClaims)
    .where(and(eq(dietClaims.userId, user.id), eq(dietClaims.programId, programId), sql`${dietClaims.status} != 'completed'`));
  if (existing) return { ok: false as const, reason: "already_claimed" as const };

  try {
    const claimId = randomUUID();
    await db.insert(dietClaims).values({ id: claimId, userId: user.id, programId, status: "pending" });
    return { ok: true as const, claimId };
  } catch (err) {
    // partial unique index (user_id, program_id) where status != 'completed'
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "23505") {
      return { ok: false as const, reason: "already_claimed" as const };
    }
    throw err;
  }
}

const foodSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
});

export async function saveFood(input: FormData) {
  await requireAdmin();
  const parsed = parseOrError(foodSchema, {
    id: input.get("id"),
    name: input.get("name"),
    category: input.get("category"),
  });
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  await db
    .insert(foods)
    .values({ id: data.id, name: data.name, category: data.category, source: "admin", sourceVersion: "admin" })
    .onConflictDoUpdate({ target: foods.id, set: { name: data.name, category: data.category } });
  return { ok: true as const };
}

const servingUnitSchema = z.object({
  id: z.string().min(1),
  foodId: z.string().min(1),
  name: z.string().min(1),
  gramsEquivalent: z.string().regex(/^\d+(\.\d+)?$/).refine((v) => Number(v) > 0, "must be a positive number"),
});

export async function saveServingUnit(input: FormData) {
  await requireAdmin();
  const parsed = parseOrError(servingUnitSchema, {
    id: input.get("id"),
    foodId: input.get("foodId"),
    name: input.get("name"),
    gramsEquivalent: input.get("gramsEquivalent"),
  });
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  await db
    .insert(servingUnits)
    .values({ id: data.id, foodId: data.foodId, name: data.name, gramsEquivalent: data.gramsEquivalent })
    .onConflictDoUpdate({
      target: servingUnits.id,
      set: { foodId: data.foodId, name: data.name, gramsEquivalent: data.gramsEquivalent },
    });
  return { ok: true as const };
}

const foodNutrientSchema = z.object({ foodId: z.string().min(1) });

export async function saveFoodNutrient(input: FormData) {
  await requireAdmin();
  const parsed = parseOrError(foodNutrientSchema, { foodId: input.get("foodId") });
  if (!parsed.ok) return parsed;
  const foodId = parsed.data.foodId;

  const nutrientRows = await db.select({ id: nutrients.id }).from(nutrients);
  const upserts: { foodId: string; nutrientId: string; amountPer100g: string }[] = [];
  for (const n of nutrientRows) {
    const raw = input.get(`amount-${n.id}`);
    if (raw === null || String(raw).trim() === "") continue;
    const value = String(raw);
    if (!/^\d+(\.\d+)?$/.test(value) || Number(value) < 0) {
      return { ok: false as const, error: `Invalid amount for ${n.id}` };
    }
    upserts.push({ foodId, nutrientId: n.id, amountPer100g: value });
  }
  if (upserts.length > 0) {
    await db
      .insert(foodNutrients)
      .values(upserts)
      .onConflictDoUpdate({
        target: [foodNutrients.foodId, foodNutrients.nutrientId],
        set: { amountPer100g: sql`excluded.amount_per_100g` },
      });
  }
  return { ok: true as const };
}

const dietProgramSchema = z.object({
  nameFa: z.string().min(1),
  nameEn: z.string().optional(),
  nameAr: z.string().optional(),
  organizationContext: z.enum(["banks", "universities", "health_centers", "clinics", "other"]),
  planType: z.string().min(1),
  durationDays: z.number().int().positive(),
  price: z.string().regex(/^\d+$/),
  downloadUrl: z.string().url().optional(),
  descriptionFa: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
});

export async function createDietProgram(input: z.infer<typeof dietProgramSchema>) {
  await requireAdmin();
  const parsed = parseOrError(dietProgramSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(dietPrograms).values({
      id,
      name: data.nameFa,
      organizationContext: data.organizationContext,
      planType: data.planType,
      durationDays: data.durationDays,
      price: data.price,
      practitionerId: null,
      description: data.descriptionFa ?? null,
      downloadUrl: data.downloadUrl ?? null,
    });
    for (const [locale, value] of [["en", data.nameEn], ["ar", data.nameAr]] as const) {
      if (value) await tx.insert(translations).values({ entityType: "diet_program", entityId: id, locale, field: "name", value });
    }
    for (const [locale, value] of [["en", data.descriptionEn], ["ar", data.descriptionAr]] as const) {
      if (value) await tx.insert(translations).values({ entityType: "diet_program", entityId: id, locale, field: "description", value });
    }
  });
  return { ok: true as const, id };
}

export function validatePeriodInput(input: { title: string; startsOn: string; endsOn: string }) {
  const title = input.title?.trim() ?? "";
  if (title.length < 1 || title.length > 80) return { ok: false as const, error: "invalid title" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startsOn) || !/^\d{4}-\d{2}-\d{2}$/.test(input.endsOn)) {
    return { ok: false as const, error: "invalid dates" };
  }
  const start = new Date(`${input.startsOn}T00:00:00Z`);
  const end = new Date(`${input.endsOn}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false as const, error: "invalid dates" };
  }
  if (end < start) return { ok: false as const, error: "end before start" };
  const spanDays = Math.round((end.getTime() - start.getTime()) / (24 * 3600 * 1000)) + 1;
  if (spanDays > 62) return { ok: false as const, error: "period too long" };
  return { ok: true as const, data: { title, startsOn: input.startsOn, endsOn: input.endsOn } };
}

const periodPhysiologySchema = z.object({
  sex: z.enum(["male", "female"]),
  age: z.number().int().min(0).max(120),
  weightKg: z.number().min(25).max(300),
  heightCm: z.number().min(80).max(250),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
});

export async function createPeriod(input: {
  title: string;
  startsOn: string;
  endsOn: string;
  sex?: "male" | "female";
  age?: number;
  weightKg?: number;
  heightCm?: number;
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active";
}) {
  const user = await requireUser();
  const validated = validatePeriodInput({ title: input.title, startsOn: input.startsOn, endsOn: input.endsOn });
  if (!validated.ok) return validated;
  const profile = await getPhysiology(user.id);
  const merged = {
    sex: input.sex ?? (profile?.sex as "male" | "female" | undefined),
    age: input.age ?? profile?.age,
    weightKg: input.weightKg ?? (profile?.weightKg !== undefined ? Number(profile.weightKg) : undefined),
    heightCm: input.heightCm ?? (profile?.heightCm !== undefined ? Number(profile.heightCm) : undefined),
    activityLevel: input.activityLevel ?? (profile?.activityLevel as typeof input.activityLevel | undefined) ?? "moderate",
  };
  if (merged.sex === undefined || merged.age === undefined || merged.weightKg === undefined || merged.heightCm === undefined) {
    return { ok: false as const, error: "physiology required" };
  }
  const parsed = periodPhysiologySchema.safeParse(merged);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues.map((i) => i.message).join("; ") };
  const id = randomUUID();
  await db.insert(intakePeriods).values({
    id,
    userId: user.id,
    title: validated.data.title,
    startsOn: validated.data.startsOn,
    endsOn: validated.data.endsOn,
    sex: parsed.data.sex,
    age: parsed.data.age,
    weightKg: String(parsed.data.weightKg),
    heightCm: String(parsed.data.heightCm),
    activityLevel: parsed.data.activityLevel,
  });
  return { ok: true as const, id };
}

export async function deleteIntake(id: string) {
  const user = await requireUser();
  await db.delete(foodIntakes).where(and(eq(foodIntakes.id, id), eq(foodIntakes.userId, user.id)));
  return { ok: true as const };
}
