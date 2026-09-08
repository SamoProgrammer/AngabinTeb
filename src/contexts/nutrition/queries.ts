import "server-only";
import { cache } from "react";
import { sql, eq, and, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { physiologyProfiles, foodIntakes, foods, servingUnits, nutrients, foodNutrients, dailyNutrition, dietPrograms, dietClaims, providers } from "@/db/schema";
import { localizedRows } from "@/lib/translate";
import { bmr, tdee, canAccessProgramContent, type ActivityLevel } from "./kernel";
import type { FoodCard, FoodDetail, FoodOption, ProgramCard, ProgramContent } from "./model";

export const getPhysiology = cache(async (userId: string) => {
  const [row] = await db.select().from(physiologyProfiles).where(eq(physiologyProfiles.userId, userId));
  if (!row) return null;
  const age = Math.floor((Date.now() - new Date(row.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
  const bmrValue = bmr({ sex: row.sex as "male" | "female", weightKg: Number(row.weightKg), heightCm: Number(row.heightCm), age });
  return {
    ...row,
    age,
    bmr: Math.round(bmrValue),
    tdee: Math.round(tdee(bmrValue, row.activityLevel as ActivityLevel)),
  };
});

export const dayIntake = cache(async (userId: string, day: string) => {
  const start = `${day}T00:00:00Z`;
  const nextDay = new Date(start);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const intakes = await db
    .select({
      id: foodIntakes.id,
      foodId: foodIntakes.foodId,
      foodName: foods.name,
      servingUnitName: servingUnits.name,
      quantity: foodIntakes.quantity,
      loggedAt: foodIntakes.loggedAt,
    })
    .from(foodIntakes)
    .innerJoin(foods, eq(foodIntakes.foodId, foods.id))
    .innerJoin(servingUnits, eq(foodIntakes.servingUnitId, servingUnits.id))
    .where(and(
      eq(foodIntakes.userId, userId),
      gte(foodIntakes.loggedAt, new Date(start)),
      lt(foodIntakes.loggedAt, nextDay),
    ))
    .orderBy(foodIntakes.loggedAt);

  const [rollup] = await db
    .select()
    .from(dailyNutrition)
    .where(and(eq(dailyNutrition.userId, userId), eq(dailyNutrition.day, day)));

  return {
    intakes,
    totals: rollup
      ? { "n-energy": Number(rollup.energyKcal), "n-carbs": Number(rollup.carbsG), "n-protein": Number(rollup.proteinG), "n-fat": Number(rollup.fatG) }
      : {},
  };
});

export const searchFoods = cache(async (_locale: string, term: string, category?: string, page = 1): Promise<{ rows: FoodCard[]; total: number }> => {
  const where = and(
    term.trim() ? sql`to_tsvector('simple', ${foods.name}) @@ plainto_tsquery('simple', ${term.trim()})` : undefined,
    category ? eq(foods.category, category) : undefined,
  );
  const rows = await db
    .select({ id: foods.id, name: foods.name, category: foods.category })
    .from(foods)
    .where(where)
    .orderBy(foods.name)
    .limit(20)
    .offset((page - 1) * 20);
  const [count] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(foods)
    .where(where);
  return { rows, total: count?.total ?? 0 };
});

export const getFoodDetail = cache(async (id: string, _locale: string): Promise<FoodDetail | null> => {
  const [food] = await db.select().from(foods).where(eq(foods.id, id));
  if (!food) return null;
  const [servingUnitsRows, nutrientRows] = await Promise.all([
    db
      .select({ id: servingUnits.id, name: servingUnits.name, gramsEquivalent: servingUnits.gramsEquivalent })
      .from(servingUnits)
      .where(eq(servingUnits.foodId, id))
      .orderBy(servingUnits.name),
    db
      .select({
        nutrientId: foodNutrients.nutrientId,
        name: nutrients.name,
        unit: nutrients.unit,
        amountPer100g: foodNutrients.amountPer100g,
      })
      .from(foodNutrients)
      .innerJoin(nutrients, eq(foodNutrients.nutrientId, nutrients.id))
      .where(eq(foodNutrients.foodId, id))
      .orderBy(nutrients.name),
  ]);
  return {
    id: food.id,
    name: food.name,
    category: food.category,
    servingUnits: servingUnitsRows,
    nutrients: nutrientRows,
  };
});

export const getFoodAdmin = cache(async (id: string) => {
  const [food] = await db.select().from(foods).where(eq(foods.id, id));
  if (!food) return null;
  const [servingUnitsRows, nutrientRows] = await Promise.all([
    db
      .select({ id: servingUnits.id, name: servingUnits.name, gramsEquivalent: servingUnits.gramsEquivalent })
      .from(servingUnits)
      .where(eq(servingUnits.foodId, id))
      .orderBy(servingUnits.name),
    db
      .select({
        nutrientId: foodNutrients.nutrientId,
        name: nutrients.name,
        unit: nutrients.unit,
        amountPer100g: foodNutrients.amountPer100g,
      })
      .from(foodNutrients)
      .innerJoin(nutrients, eq(foodNutrients.nutrientId, nutrients.id))
      .where(eq(foodNutrients.foodId, id))
      .orderBy(nutrients.name),
  ]);
  return { ...food, servingUnits: servingUnitsRows, nutrients: nutrientRows };
});

export const foodPickerOptions = cache(async (_locale: string): Promise<FoodOption[]> => {
  const rows = await db
    .select({
      id: foods.id,
      name: foods.name,
      servingUnitId: servingUnits.id,
      servingUnitName: servingUnits.name,
    })
    .from(foods)
    .leftJoin(servingUnits, eq(servingUnits.foodId, foods.id))
    .orderBy(foods.name);
  const map = new Map<string, FoodOption>();
  for (const row of rows) {
    const option = map.get(row.id) ?? { id: row.id, name: row.name, servingUnits: [] };
    if (row.servingUnitId && row.servingUnitName) option.servingUnits.push({ id: row.servingUnitId, name: row.servingUnitName });
    map.set(row.id, option);
  }
  return [...map.values()];
});

export const listPrograms = cache(async (context: string, locale: string): Promise<ProgramCard[]> => {
  const rows = await db
    .select({
      id: dietPrograms.id,
      name: dietPrograms.name,
      description: dietPrograms.description,
      organizationContext: dietPrograms.organizationContext,
      planType: dietPrograms.planType,
      durationDays: dietPrograms.durationDays,
      price: dietPrograms.price,
      practitionerName: providers.name,
      practitionerPhone: providers.phone,
    })
    .from(dietPrograms)
    .leftJoin(providers, eq(dietPrograms.practitionerId, providers.id))
    .where(eq(dietPrograms.organizationContext, context))
    .orderBy(dietPrograms.name);
  return (await localizedRows("diet_program", rows, locale, ["name", "description"])) as ProgramCard[];
});

export const myClaims = cache(async (
  userId: string,
  dbc: typeof db = db,
): Promise<Array<{ programId: string; status: string }>> => {
  // All statuses: a completed claim is still ownership — owners re-access
  // without re-claiming, so completed rows must stay visible here.
  return dbc
    .select({ programId: dietClaims.programId, status: dietClaims.status })
    .from(dietClaims)
    .where(eq(dietClaims.userId, userId));
});

// Claim-gated serving point (ticket 13 / spec F1). The ONLY path that hands
// out a program's download: priced programs require a claim row (any status),
// otherwise downloadUrl is nulled server-side — hiding buttons is not enough.
// The optional db override mirrors the booking seam: tests run this against a
// disposable database without touching the dev database.
export const getProgramContent = cache(async (
  programId: string,
  userId: string,
  locale: string,
  dbc: typeof db = db,
): Promise<ProgramContent | null> => {
  const [row] = await dbc
    .select({
      id: dietPrograms.id,
      name: dietPrograms.name,
      description: dietPrograms.description,
      organizationContext: dietPrograms.organizationContext,
      planType: dietPrograms.planType,
      durationDays: dietPrograms.durationDays,
      price: dietPrograms.price,
      downloadUrl: dietPrograms.downloadUrl,
      practitionerName: providers.name,
      practitionerPhone: providers.phone,
    })
    .from(dietPrograms)
    .leftJoin(providers, eq(dietPrograms.practitionerId, providers.id))
    .where(eq(dietPrograms.id, programId));
  if (!row) return null;

  const claims = await dbc
    .select({ id: dietClaims.id })
    .from(dietClaims)
    .where(and(eq(dietClaims.userId, userId), eq(dietClaims.programId, programId)));
  const hasClaim = claims.length > 0;
  const allowed = canAccessProgramContent(row.price, hasClaim);

  const [overlaid] = await localizedRows(
    "diet_program",
    [row],
    locale,
    ["name", "description"],
    dbc,
  );
  return {
    ...(overlaid as typeof row),
    hasClaim,
    accessDenied: !allowed,
    downloadUrl: allowed ? row.downloadUrl : null,
  };
});