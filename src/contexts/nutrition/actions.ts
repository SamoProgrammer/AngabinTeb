"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import { sql, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { physiologyProfiles, foodIntakes, foods, servingUnits, foodNutrients, dailyNutrition, dietPrograms, dietClaims, dietDocuments, clinicalRegistries, nutrients, translations, intakePeriods } from "@/db/schema";
import { requireAdmin, requireUser } from "@/contexts/identity/actions";
import { buildDietPrompt, summarizeRegistry, generateDietPlan, DIET_DOC_FOOTER, DIET_PROMPT_VERSION } from "@/lib/ai-diet";
import { servingToGrams, nutrientsForIntake, validatePeriodInput } from "./kernel";
import { getPhysiology, getPeriod } from "./queries";

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
  mealSlot: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  periodId: z.string().min(1).optional(),
  loggedAt: z.string().datetime().optional(),
});

export async function logIntake(input: z.infer<typeof intakeSchema>) {
  const user = await requireUser();
  const parsed = intakeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues.map((i) => i.message).join("; ") };
  const data = parsed.data;

  if (data.periodId) {
    const period = await getPeriod(user.id, data.periodId);
    if (!period) throw new Error("invalid period");
  }

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

    await tx.insert(foodIntakes).values({ id: randomUUID(), userId: user.id, foodId: data.foodId, servingUnitId: data.servingUnitId, quantity: String(data.quantity), mealSlot: data.mealSlot ?? null, periodId: data.periodId ?? null, loggedAt: data.loggedAt ? new Date(data.loggedAt) : new Date() });
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

// Minimal paid step for the paid → generating → ready chain: no payment
// gateway is wired (paid = downloadable content), so the owner confirms an
// offline/at-clinic payment to unlock document generation.
export async function markDietClaimPaid(claimId: string, opts?: { dbc?: typeof db }) {
  const dbc = opts?.dbc ?? db;
  const user = await requireUser();
  const [claim] = await dbc
    .select({ id: dietClaims.id, status: dietClaims.status })
    .from(dietClaims)
    .where(and(eq(dietClaims.id, claimId), eq(dietClaims.userId, user.id)));
  if (!claim) return { ok: false as const, reason: "not_found" as const };
  if (claim.status !== "pending") return { ok: false as const, reason: "invalid_status" as const };
  await dbc.update(dietClaims).set({ status: "paid" }).where(eq(dietClaims.id, claimId));
  return { ok: true as const };
}

// Long-form AI diet document (Task 5). Accepts own claims in `paid` (fresh)
// or `generating` (retry after a failed attempt). Sets `generating` first,
// then generates, stores the document with the specialist-review footer, and
// flips to `ready`. On any throw the claim stays `generating` (retryable);
// `paid`/`generating`/`ready` are all != 'completed' so the
// one_claim_per_program partial unique index keeps working untouched.
export async function generateProgramDocument(claimId: string, opts?: { dbc?: typeof db }) {
  const dbc = opts?.dbc ?? db;
  const user = await requireUser();
  const [claim] = await dbc
    .select({ id: dietClaims.id, programId: dietClaims.programId, status: dietClaims.status })
    .from(dietClaims)
    .where(and(eq(dietClaims.id, claimId), eq(dietClaims.userId, user.id)));
  if (!claim) return { ok: false as const, reason: "not_found" as const };
  const [existingDoc] = await dbc
    .select({ id: dietDocuments.id })
    .from(dietDocuments)
    .where(eq(dietDocuments.claimId, claimId));
  if (existingDoc) {
    if (claim.status !== "ready") {
      await dbc.update(dietClaims).set({ status: "ready" }).where(eq(dietClaims.id, claimId));
    }
    return { ok: true as const };
  }
  if (claim.status !== "paid" && claim.status !== "generating") {
    return { ok: false as const, reason: "invalid_status" as const };
  }
  await dbc.update(dietClaims).set({ status: "generating" }).where(eq(dietClaims.id, claimId));
  try {
    const [program] = await dbc.select().from(dietPrograms).where(eq(dietPrograms.id, claim.programId));
    const [profile] = await dbc.select().from(physiologyProfiles).where(eq(physiologyProfiles.userId, user.id));
    const [registry] = await dbc.select().from(clinicalRegistries).where(eq(clinicalRegistries.userId, user.id));
    const periods = await dbc.select().from(intakePeriods).where(eq(intakePeriods.userId, user.id));
    const age = profile
      ? Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
      : 30;
    const prompt = buildDietPrompt({
      sex: (profile?.sex as "male" | "female" | undefined) ?? "female",
      age,
      weightKg: profile ? Number(profile.weightKg) : 70,
      heightCm: profile ? Number(profile.heightCm) : 170,
      activityLevel: profile?.activityLevel ?? "moderate",
      programType: program?.planType ?? program?.name ?? "",
      registrySummary: summarizeRegistry(registry ?? null),
      periodSummary:
        periods.length > 0 ? `تعداد دوره‌ها: ${periods.length}؛ آخرین دوره: ${periods[0]?.title ?? ""}` : "",
    });
    const text = await generateDietPlan(prompt);
    await dbc.transaction(async (tx) => {
      await tx.insert(dietDocuments).values({
        id: randomUUID(),
        claimId,
        model: process.env.AI_MODEL ?? "openai/gpt-5.4",
        promptVersion: DIET_PROMPT_VERSION,
        bodyMarkdown: `${text}\n\n---\n${DIET_DOC_FOOTER}`,
      });
      await tx.update(dietClaims).set({ status: "ready" }).where(eq(dietClaims.id, claimId));
    });
    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "generation_failed" as const };
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
