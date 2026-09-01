"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import { sql, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { physiologyProfiles, foodIntakes, foods, servingUnits, foodNutrients, dailyNutrition, dietPrograms, dietClaims } from "@/db/schema";
import { requireUser } from "@/contexts/identity/actions";
import { servingToGrams, nutrientsForIntake } from "./kernel";

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